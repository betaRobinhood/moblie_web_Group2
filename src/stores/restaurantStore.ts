import { defineStore } from 'pinia';
import { db } from '../services/firebase';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import type { Restaurant } from '../models/types';

export const useRestaurantStore = defineStore('restaurant', {
    state: () => ({
        restaurants: [] as Restaurant[],
        loading: false
    }),
    actions: {
        subscribeToRestaurants() {
            this.loading = true;
            const q = query(collection(db, 'restaurants'), where('queueEnabled', '==', true));
            return onSnapshot(q, (snapshot) => {
                this.restaurants = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Restaurant));
                this.loading = false;
            });
        }
    }
});
