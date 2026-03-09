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
                const dbRestaurants = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Restaurant));

                // Add mock restaurants for UI demonstration
                const mockRestaurants: Restaurant[] = [
                    {
                        id: 'mock-res-1',
                        name: { en: 'Sushiro', th: 'ซูชิโร่' },
                        description: { en: 'The best conveyor belt sushi from Japan.', th: 'ซูชิสายพานอันดับ 1 จากญี่ปุ่น' },
                        location: 'Central World, 7th Floor',
                        openingHours: '10:00 - 22:00',
                        avgDiningTime: 45,
                        queueEnabled: false,
                        coverImageUrl: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=800&q=80'
                    },
                    {
                        id: 'mock-res-2',
                        name: { en: 'Haidilao', th: 'ไฮตี้เหลา' },
                        description: { en: 'First-class service hotpot experience.', th: 'ประสบการณ์หม้อไฟบริการระดับพรีเมียม' },
                        location: 'Siam Paragon, G Floor',
                        openingHours: '10:00 - 03:00',
                        avgDiningTime: 90,
                        queueEnabled: false,
                        coverImageUrl: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=800&q=80'
                    }
                ];

                this.restaurants = [...dbRestaurants, ...mockRestaurants];
                this.loading = false;
            });
        }
    }
});
