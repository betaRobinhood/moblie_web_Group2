import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

/**
 * Automatically update queue position and estimated wait time
 * when a new queue entry is added or updated.
 */
export const updateQueueEstimation = functions.firestore
    .document('queues/{queueId}')
    .onWrite(async (change, context) => {
        const data = change.after.exists ? change.after.data() : null;
        if (!data || data.status !== 'waiting') return;

        const restaurantId = data.restaurantId;
        const db = admin.firestore();

        // Get all waiting queues for this restaurant
        const snapshot = await db.collection('queues')
            .where('restaurantId', '==', restaurantId)
            .where('status', '==', 'waiting')
            .orderBy('createdAt', 'asc')
            .get();

        // Get restaurant metadata for estimation
        const restDoc = await db.collection('restaurants').doc(restaurantId).get();
        const restData = restDoc.data();
        const avgDiningTime = restData?.avgDiningTime || 45;
        const availableTables = 10; // This should be dynamic based on tables collection

        const batch = db.batch();
        snapshot.docs.forEach((doc, index) => {
            const position = index + 1;
            const estWaitTime = Math.ceil((position / availableTables) * avgDiningTime);

            batch.update(doc.ref, {
                position: position,
                estimatedWaitTime: estWaitTime
            });
        });

        return batch.commit();
    });

/**
 * Handle auto-skip for no-show customers (e.g., called > 15 mins ago)
 */
export const autoSkipNoShow = functions.pubsub.schedule('every 5 minutes').onRun(async (context) => {
    const db = admin.firestore();
    const threshold = new Date(Date.now() - 15 * 60 * 1000); // 15 mins ago

    const snapshot = await db.collection('queues')
        .where('status', '==', 'called')
        .where('calledAt', '<=', threshold)
        .get();

    const batch = db.batch();
    snapshot.docs.forEach(doc => {
        batch.update(doc.ref, { status: 'skipped' });
    });

    return batch.commit();
});
