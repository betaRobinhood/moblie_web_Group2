import { defineStore } from 'pinia';
import type { OrderItem } from '../models/types';

export const useCartStore = defineStore('cart', {
    state: () => ({
        items: [] as OrderItem[],
        restaurantId: null as string | null,
        tableId: null as string | null
    }),
    getters: {
        totalPrice: (state) => state.items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        itemCount: (state) => state.items.reduce((sum, item) => sum + item.quantity, 0)
    },
    actions: {
        addToCart(item: OrderItem) {
            const existing = this.items.find(i => i.menuItemId === item.menuItemId);
            if (existing) {
                existing.quantity += item.quantity;
            } else {
                this.items.push({ ...item });
            }
        },
        removeFromCart(menuItemId: string) {
            const idx = this.items.findIndex(i => i.menuItemId === menuItemId);
            if (idx !== -1) this.items.splice(idx, 1);
        },
        clearCart() {
            this.items = [];
            this.restaurantId = null;
            this.tableId = null;
        }
    }
});
