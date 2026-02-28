const { onDocumentUpdated } = require("firebase-functions/v2/firestore");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const admin = require("firebase-admin");
admin.initializeApp();

const db = admin.firestore();

// ────────────────────────────────────────────
// 1. 할 일 완료 시 푸시 알림 (기존 함수)
// ────────────────────────────────────────────
exports.sendPushNotificationOnComplete = onDocumentUpdated("todos/{todoId}", async (event) => {
    const beforeData = event.data.before.data();
    const afterData = event.data.after.data();

    // Only proceed if status changed from something else to 'done'
    if (beforeData.status !== "done" && afterData.status === "done") {
        const todoTitle = afterData.title;
        const completedBy = afterData.lastCompletedBy || "누군가";

        try {
            const tokensSnapshot = await db.collection("fcmTokens").get();
            if (tokensSnapshot.empty) {
                console.log("No FCM tokens found in DB.");
                return null;
            }

            const tokens = [];
            tokensSnapshot.forEach((doc) => {
                const tokenData = doc.data();
                if (tokenData && tokenData.token) {
                    tokens.push(tokenData.token);
                }
            });

            if (tokens.length > 0) {
                const message = {
                    data: {
                        type: "TODO_COMPLETED",
                        title: "할 일 완료 알림",
                        body: `${completedBy}님이 '${todoTitle}' 할 일을 완료했습니다!`,
                        completedBy: completedBy,
                        todoTitle: todoTitle,
                        url: "/"
                    },
                    webpush: {
                        headers: {
                            Urgency: "high",
                            TTL: "86400"
                        },
                        fcmOptions: {
                            link: "/"
                        }
                    },
                    tokens: tokens
                };

                const response = await admin.messaging().sendEachForMulticast(message);

                // Cleanup invalid tokens
                const tokensToRemove = [];
                response.responses.forEach((result, index) => {
                    if (!result.success) {
                        const error = result.error;
                        console.error("Failure sending notification to", tokens[index], error);
                        if (
                            error.code === "messaging/invalid-registration-token" ||
                            error.code === "messaging/registration-token-not-registered"
                        ) {
                            tokensSnapshot.forEach((doc) => {
                                if (doc.data().token === tokens[index]) {
                                    tokensToRemove.push(doc.ref.delete());
                                }
                            });
                        }
                    }
                });

                if (tokensToRemove.length > 0) {
                    await Promise.all(tokensToRemove);
                    console.log("Removed " + tokensToRemove.length + " invalid tokens.");
                }
                console.log("Push sent to " + tokens.length + " devices, successes: " + response.successCount);
            }
        } catch (error) {
            console.error("Error broadcasting push notification:", error);
        }
    }

    return null;
});

// ────────────────────────────────────────────
// 2. 마감 임박 리마인더 (remindAt 시간 도래 시)
//    매 1분마다 실행
// ────────────────────────────────────────────
exports.checkDeadlineReminders = onSchedule("every 1 minutes", async () => {
    const now = admin.firestore.Timestamp.now();

    try {
        // remindAt <= now AND status != done AND reminderSent != true
        const snapshot = await db.collection("todos")
            .where("remindAt", "<=", now)
            .where("status", "!=", "done")
            .get();

        if (snapshot.empty) {
            return null;
        }

        // Filter out already-sent reminders (can't do compound inequality in Firestore)
        const todosToRemind = [];
        snapshot.forEach((doc) => {
            const data = doc.data();
            if (data.reminderSent !== true) {
                todosToRemind.push({ id: doc.id, ...data });
            }
        });

        if (todosToRemind.length === 0) return null;

        // Get all FCM tokens
        const tokensSnapshot = await db.collection("fcmTokens").get();
        if (tokensSnapshot.empty) return null;

        const tokens = [];
        tokensSnapshot.forEach((doc) => {
            const td = doc.data();
            if (td && td.token) tokens.push(td.token);
        });

        if (tokens.length === 0) return null;

        // Send reminder for each todo
        for (const todo of todosToRemind) {
            const message = {
                data: {
                    type: "DEADLINE_REMINDER",
                    title: "⏰ 마감 임박 알림",
                    body: `'${todo.title}' 마감 시간이 곧 도래합니다!`,
                    todoTitle: todo.title || "",
                    todoId: todo.id,
                    url: "/"
                },
                webpush: {
                    headers: { Urgency: "high", TTL: "3600" },
                    fcmOptions: { link: "/" }
                },
                tokens: tokens
            };

            try {
                const response = await admin.messaging().sendEachForMulticast(message);
                console.log(`Reminder sent for '${todo.title}': ${response.successCount} successes`);

                // Clean up invalid tokens
                await cleanupInvalidTokens(tokensSnapshot, tokens, response);
            } catch (sendErr) {
                console.error(`Error sending reminder for '${todo.title}':`, sendErr);
            }

            // Mark as sent
            await db.collection("todos").doc(todo.id).update({
                reminderSent: true
            });
        }

        console.log(`Processed ${todosToRemind.length} deadline reminders.`);
    } catch (error) {
        console.error("checkDeadlineReminders error:", error);
    }

    return null;
});

// ────────────────────────────────────────────
// 3. 마감 시간 도달 알림 (deadline 시간 도래 시)
//    매 1분마다 실행
// ────────────────────────────────────────────
exports.checkDeadlineArrived = onSchedule("every 1 minutes", async () => {
    const now = admin.firestore.Timestamp.now();

    try {
        // deadline <= now AND status != done
        const snapshot = await db.collection("todos")
            .where("deadline", "<=", now)
            .where("status", "!=", "done")
            .get();

        if (snapshot.empty) return null;

        // Filter out already-notified
        const todosToNotify = [];
        snapshot.forEach((doc) => {
            const data = doc.data();
            if (data.deadlineNotified !== true) {
                todosToNotify.push({ id: doc.id, ...data });
            }
        });

        if (todosToNotify.length === 0) return null;

        // Get all FCM tokens
        const tokensSnapshot = await db.collection("fcmTokens").get();
        if (tokensSnapshot.empty) return null;

        const tokens = [];
        tokensSnapshot.forEach((doc) => {
            const td = doc.data();
            if (td && td.token) tokens.push(td.token);
        });

        if (tokens.length === 0) return null;

        // Send deadline notification for each todo
        for (const todo of todosToNotify) {
            const message = {
                data: {
                    type: "DEADLINE_ARRIVED",
                    title: "🔴 마감 시간 도달",
                    body: `'${todo.title}' 의 마감 시간이 지났습니다!`,
                    todoTitle: todo.title || "",
                    todoId: todo.id,
                    url: "/"
                },
                webpush: {
                    headers: { Urgency: "high", TTL: "3600" },
                    fcmOptions: { link: "/" }
                },
                tokens: tokens
            };

            try {
                const response = await admin.messaging().sendEachForMulticast(message);
                console.log(`Deadline notification sent for '${todo.title}': ${response.successCount} successes`);

                await cleanupInvalidTokens(tokensSnapshot, tokens, response);
            } catch (sendErr) {
                console.error(`Error sending deadline notification for '${todo.title}':`, sendErr);
            }

            // Mark as notified
            await db.collection("todos").doc(todo.id).update({
                deadlineNotified: true
            });
        }

        console.log(`Processed ${todosToNotify.length} deadline arrived notifications.`);
    } catch (error) {
        console.error("checkDeadlineArrived error:", error);
    }

    return null;
});

// ────────────────────────────────────────────
// Helper: cleanup invalid FCM tokens
// ────────────────────────────────────────────
async function cleanupInvalidTokens(tokensSnapshot, tokens, response) {
    const tokensToRemove = [];
    response.responses.forEach((result, index) => {
        if (!result.success) {
            const error = result.error;
            if (
                error.code === "messaging/invalid-registration-token" ||
                error.code === "messaging/registration-token-not-registered"
            ) {
                tokensSnapshot.forEach((doc) => {
                    if (doc.data().token === tokens[index]) {
                        tokensToRemove.push(doc.ref.delete());
                    }
                });
            }
        }
    });

    if (tokensToRemove.length > 0) {
        await Promise.all(tokensToRemove);
        console.log("Removed " + tokensToRemove.length + " invalid tokens.");
    }
}
