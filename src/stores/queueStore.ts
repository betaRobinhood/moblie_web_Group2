import { defineStore } from 'pinia';
import { db } from '../services/firebase';
import { collection, onSnapshot, query, where, addDoc, serverTimestamp, orderBy, limit } from 'firebase/firestore';
import type { QueueEntry } from '../models/types';

export const useQueueStore = defineStore('queue', {
    state: () => ({
        activeQueue: null as QueueEntry | null,
        loading: false
    }),
    actions: {
        async joinQueue(restaurantId: string, userId: string, partySize: number) {
            this.loading = true;
            try {
                await addDoc(collection(db, 'queues'), {
                    restaurantId,
                    userId,
                    partySize,
                    status: 'waiting',
                    createdAt: serverTimestamp(),
                    position: 0, // Will be updated by Cloud Function
                    estimatedWaitTime: 0 // Will be updated by Cloud Function
                });
            } finally {
                this.loading = false;
            }
        },
        subscribeToUserQueue(userId: string) {
            const q = query(
                collection(db, 'queues'),
                where('userId', '==', userId),
                where('status', 'in', ['waiting', 'called', 'seated']),
                orderBy('createdAt', 'desc'),
                limit(1)
            );
            return onSnapshot(q, (snapshot) => {
                if (!snapshot.empty) {
                    this.activeQueue = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as QueueEntry;
                } else {
                    this.activeQueue = null;
                }
            });
        }
    }
});
