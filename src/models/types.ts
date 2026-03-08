export interface MultilingualText {
    en: string;
    th: string;
}

export interface Restaurant {
    id: string;
    name: MultilingualText;
    description: MultilingualText;
    location: string;
    openingHours: string;
    avgDiningTime: number; // in minutes
    queueEnabled: boolean;
    coverImageUrl: string;
}

export interface QueueEntry {
    id: string;
    userId: string;
    restaurantId: string;
    position: number;
    status: 'waiting' | 'called' | 'seated' | 'skipped' | 'completed';
    createdAt: any; // Timestamp
    estimatedWaitTime: number; // in minutes
    partySize: number;
}

export interface MenuItem {
    id: string;
    name: MultilingualText;
    description: MultilingualText;
    price: number;
    imageUrl: string;
    category: string;
}

export interface Order {
    id: string;
    userId: string;
    restaurantId: string;
    tableId: string;
    status: 'ordering' | 'preparing' | 'served' | 'completed';
    items: OrderItem[];
    totalPrice: number;
    createdAt: any;
}

export interface OrderItem {
    menuItemId: string;
    name: MultilingualText;
    quantity: number;
    price: number;
}
