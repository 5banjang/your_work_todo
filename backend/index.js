const { onDocumentUpdated } = require("firebase-functions/v2/firestore");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const admin = require("firebase-admin");
admin.initializeApp();

exports.sendPushNotificationOnComplete = onDocumentUpdated("todos/{todoId}", async (event) => {
    const beforeData = event.data.before.data();
    const afterData = event.data.after.data();

    // Only proceed if status changed from something else to 'done'
    if (beforeData.status !== "done" && afterData.status === "done") {
        const todoTitle = afterData.title;
        const completedBy = afterData.lastCompletedBy || "누군가";

        try {
            const tokensSnapshot = await admin.firestore().collection("fcmTokens").get();
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
                // ★ data-only 메시지 (notification 키 없음)
                // notification 키가 있으면 브라우저가 직접 알림을 표시하여
                // Service Worker의 커스텀 옵션(사운드 등)이 무시됩니다.
                // data-only로 보내면 Service Worker가 알림을 직접 생성합니다.
                const message = {
                    notification: {
                        title: "할 일 완료 알림",
                        body: `${completedBy}님이 '${todoTitle}' 할 일을 완료했습니다!`,
                    },
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

// 1분마다 마감 임박 할 일을 체크하여 미리 알림을 보냅니다.
exports.checkReminders = onSchedule("every 1 minutes", async (event) => {
    const now = admin.firestore.Timestamp.now();
    const tenMinutesLater = admin.firestore.Timestamp.fromMillis(now.toMillis() + 10 * 60 * 1000);

    try {
        // 아직 완료되지 않았고, remindAt이 현재 시점부터 10분 이내인 것들 중 알림을 안 보낸 것
        const q = admin.firestore().collection("todos")
            .where("status", "!=", "done")
            .where("remindAt", ">=", now)
            .where("remindAt", "<=", tenMinutesLater);

        const snapshot = await q.get();
        if (snapshot.empty) return null;

        const reminderPromises = [];

        for (const doc of snapshot.docs) {
            const todo = doc.data();
            const todoId = doc.id;

            // 이미 알림을 보냈는지 확인 (간단한 플래그)
            if (todo.lastRemindedAt) continue;

            const tokensSnapshot = await admin.firestore().collection("fcmTokens")
                .where("userNickname", "==", todo.createdBy) // 혹은 담당자에게도? 일단 제작자에게.
                .get();

            if (tokensSnapshot.empty) continue;

            const tokens = [];
            tokensSnapshot.forEach(t => tokens.push(t.data().token));

            if (tokens.length > 0) {
                const message = {
                    notification: {
                        title: "⏰ 할 일 마감 임박",
                        body: `'${todo.title}' 할 일 마감이 다가옵니다!`,
                    },
                    data: {
                        type: "REMINDER",
                        todoId: todoId,
                        title: "할 일 미리 알림",
                        body: `'${todo.title}' 마감 시간이 다가옵니다.`
                    },
                    tokens: tokens
                };

                reminderPromises.push(admin.messaging().sendEachForMulticast(message));
                // 알림 보냄 표시
                reminderPromises.push(doc.ref.update({ lastRemindedAt: now }));
            }
        }

        await Promise.all(reminderPromises);
        console.log(`Sent ${snapshot.size} reminders.`);
    } catch (error) {
        console.error("Error in checkReminders:", error);
    }

    return null;
});
