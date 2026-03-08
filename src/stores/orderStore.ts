import { defineStore } from 'pinia';
import { db } from '../services/firebase';
import {
    collection, onSnapshot, query, where, addDoc,
    serverTimestamp, orderBy, doc, updateDoc, writeBatch
} from 'firebase/firestore';
import type { Order, OrderItem } from '../models/types';

export const useOrderStore = defineStore('order', {
    state: () => ({
        currentUserOrders: [] as Order[],
        activeStaffOrders: [] as Order[],
        loading: false
    }),
    actions: {
        async placeOrder(restaurantId: string, userId: string, tableId: string, tableNumber: number, items: OrderItem[], totalPrice: number) {
            this.loading = true;
            try {
                const orderData = {
                    restaurantId,
                    userId,
                    tableId,
                    tableNumber,
                    items,
                    totalPrice,
                    status: 'preparing',
                    createdAt: serverTimestamp()
                };
                const docRef = await addDoc(collection(db, `restaurants/${restaurantId}/orders`), orderData);
                return { success: true, id: docRef.id };
            } catch (error) {
                console.error('placeOrder error:', error);
                return { success: false, error };
            } finally {
                this.loading = false;
            }
        },

        subscribeToUserOrders(restaurantId: string, userId: string) {
            const q = query(
                collection(db, `restaurants/${restaurantId}/orders`),
                where('userId', '==', userId),
                where('status', 'in', ['preparing', 'ready', 'served']),
                orderBy('createdAt', 'desc')
            );
            return onSnapshot(q, (snapshot) => {
                this.currentUserOrders = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Order));
            }, (err) => {
                console.error('User orders subscription error:', err);
            });
        },

        subscribeToStaffOrders(restaurantId: string) {
            const q = query(
                collection(db, `restaurants/${restaurantId}/orders`),
                where('status', 'in', ['preparing', 'ready', 'served']),
                orderBy('createdAt', 'asc')
            );
            return onSnapshot(q, (snapshot) => {
                this.activeStaffOrders = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Order));
            }, (err) => {
                console.error('Staff orders subscription error:', err);
            });
        },

        async updateOrderStatus(restaurantId: string, orderId: string, status: 'preparing' | 'ready' | 'served' | 'completed') {
            try {
                const docRef = doc(db, `restaurants/${restaurantId}/orders`, orderId);
                await updateDoc(docRef, { status });
                return { success: true };
            } catch (error) {
                console.error('updateOrderStatus error:', error);
                return { success: false, error };
            }
        },

        async checkoutSession(restaurantId: string, orderIds: string[]) {
            try {
                const batch = writeBatch(db);
                orderIds.forEach(id => {
                    const docRef = doc(db, `restaurants/${restaurantId}/orders`, id);
                    batch.update(docRef, { status: 'completed' });
                });
                await batch.commit();
                return { success: true };
            } catch (error) {
                console.error('checkoutSession error:', error);
                return { success: false, error };
            }
        }
    }
});
