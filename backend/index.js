const { onDocumentUpdated } = require("firebase-functions/v2/firestore");
const admin = require("firebase-admin");
admin.initializeApp();

exports.sendPushNotificationOnComplete = onDocumentUpdated("todos/{todoId}", async (event) => {
    const beforeData = event.data.before.data();
    const afterData = event.data.after.data();

    // Only proceed if status changed from something else to 'done'
    if (beforeData.status !== "done" && afterData.status === "done") {
        const todoTitle = afterData.title;
        // 'lastCompletedBy' should have been injected by the frontend when completing
        const completedBy = afterData.lastCompletedBy || "누군가";

        // Prepare Notification Payload
        const payload = {
            notification: {
                title: "할 일 완료 알림",
                body: `${completedBy}님이 '${todoTitle}' 할 일을 완료했습니다!`,
                icon: "/icons/icon-192.png",
                requireInteraction: "true"
            },
            data: {
                click_action: "FLUTTER_NOTIFICATION_CLICK",
                url: "/"
            }
        };

        try {
            // Find all FCM Tokens stored in the 'fcmTokens' collection
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
                const message = {
                    notification: payload.notification,
                    data: payload.data,
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
                console.log("Notification broadcasts completed successfully");
            }
        } catch (error) {
            console.error("Error broadcasting push notification:", error);
        }
    }

    return null;
});
