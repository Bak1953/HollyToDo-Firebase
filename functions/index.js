const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

/**
 * Scheduled function that runs every day at 08:00 and sends an FCM notification
 * to users who have active tasks due tomorrow.
 */
exports.dailyDueReminders = functions.pubsub
    .schedule('0 8 * * *')
    .timeZone('Europe/London')
    .onRun(async (context) => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().split('T')[0];

        const usersSnap = await admin.firestore().collection('users').get();

        // Build a flat list of messages while remembering which user each token belongs to.
        const messageQueue = [];

        const todoQueries = usersSnap.docs.map(async (userDoc) => {
            const userRef = userDoc.ref;
            const tokens = userDoc.data().fcmTokens || [];
            if (!tokens.length) return;

            const todosSnap = await userRef
                .collection('todos')
                .where('dueDate', '==', tomorrowStr)
                .get();

            if (todosSnap.empty) return;

            const taskCount = todosSnap.size;
            const body = `You have ${taskCount} task${taskCount === 1 ? '' : 's'} due tomorrow.`;

            tokens.forEach((token) => {
                messageQueue.push({
                    token,
                    userRef,
                    notification: {
                        title: "Holly's ToDo - Due Tomorrow",
                        body
                    }
                });
            });
        });

        await Promise.all(todoQueries);

        if (!messageQueue.length) {
            console.log('No reminders to send.');
            return null;
        }

        const response = await admin.messaging().sendEach(
            messageQueue.map(({ token, notification }) => ({ token, notification }))
        );
        console.log(`Sent ${response.successCount} reminders, ${response.failureCount} failed.`);

        // Remove tokens that failed because they are no longer valid.
        if (response.responses) {
            const userTokenMap = new Map();
            response.responses.forEach((resp, idx) => {
                if (!resp.success) {
                    const error = resp.error;
                    const isInvalidToken = error && (
                        error.code === 'messaging/invalid-registration-token' ||
                        error.code === 'messaging/registration-token-not-registered'
                    );
                    if (isInvalidToken) {
                        const { userRef, token } = messageQueue[idx];
                        if (!userTokenMap.has(userRef.id)) {
                            userTokenMap.set(userRef.id, { userRef, tokens: [] });
                        }
                        userTokenMap.get(userRef.id).tokens.push(token);
                    }
                }
            });

            const batch = admin.firestore().batch();
            userTokenMap.forEach(({ userRef, tokens }) => {
                tokens.forEach((token) => {
                    batch.update(userRef, {
                        fcmTokens: admin.firestore.FieldValue.arrayRemove(token)
                    });
                });
            });
            await batch.commit();
        }

        return null;
    });
