<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar class="transparent-toolbar">
        <ion-buttons slot="start">
          <ion-back-button color="light"></ion-back-button>
        </ion-buttons>
        <ion-title class="page-title">สถานะอาหาร & เช็คเอาต์</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true" class="custom-bg">
      
      <div v-if="orderStore.currentUserOrders.length === 0" class="center-content empty-state">
        <ion-icon :icon="restaurantOutline" size="large"></ion-icon>
        <h3>ยังไม่มีออเดอร์</h3>
        <p>คุณยังไม่ได้สั่งอาหารในตอนนี้</p>
        <button class="find-res-btn" @click="router.push(`/restaurant/${restaurantId}/menu`)">ไปที่เมนู</button>
      </div>

      <div v-else class="ticket-wrapper">
        <div class="ticket-card">
          
          <div class="brand-logo">
            <span class="small-txt">THAI RESTAURANT</span>
            <span class="x-mark">X</span>
            <span class="big-txt">EzyDine</span>
          </div>

          <!-- Checkout QR Section -->
          <div class="qr-section">
            <p class="qr-label">QR สำหรับเช็คเอาต์</p>
            <qrcode-vue :value="checkoutQrValue" :size="180" level="H" class="qr-code" />
            <div class="table-badge">
              โต๊ะหมายเลข <span>{{ queueStore.activeQueue?.tableNumber || '-' }}</span>
            </div>
          </div>

          <div class="info-section">
            <div class="restaurant-row">
              <div class="avatar">
                <img src="https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=150&q=80" alt="Chef" />
              </div>
              <div class="res-details">
                <h3>{{ restaurant?.name[locale?.value || 'en'] || 'EzyDine Cafe' }}</h3>
                <p><ion-icon :icon="locationOutline"></ion-icon> {{ restaurant?.location || 'Floor 1, Mall A' }}</p>
              </div>
            </div>

            <h2 class="section-title">สถานะออร์เดอร์แยกตามรอบ</h2>
            <div class="batches-list">
              <div v-for="order in orderStore.currentUserOrders" :key="order.id" class="order-batch">
                <div class="batch-header">
                  <span class="batch-time">สั่งเมื่อ: {{ formatTime(order.createdAt) }}</span>
                  <span class="batch-status" :class="order.status">{{ getStatusText(order.status) }}</span>
                </div>
                <div class="batch-items">
                  <div v-for="item in order.items" :key="item.menuItemId" class="item-row">
                    <span class="qty">{{ item.quantity }}x</span>
                    <span class="name">{{ item.name[locale?.value || 'en'] || item.name['en'] }}</span>
                    <span class="price">{{ item.price * item.quantity }} THB</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="total-summary">
              <div class="summary-line">
                <span>ยอดรวมสุทธิทุกรายการ</span>
                <span class="total-price">{{ totalAmount }} THB</span>
              </div>
            </div>

            <button class="order-more-btn" @click="router.push(`/restaurant/${restaurantId}/menu`)">
              <ion-icon :icon="addCircleOutline" slot="start"></ion-icon>
              <span>สั่งอาหารเพิ่ม (Order More)</span>
            </button>
          </div>
        </div>
      </div>

    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue';
import { 
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, 
  IonIcon, IonBackButton, IonButtons 
} from '@ionic/vue';
import { 
  restaurantOutline, addCircleOutline,
  locationOutline
} from 'ionicons/icons';
import { useRoute, useRouter } from 'vue-router';
import { useOrderStore } from '../../stores/orderStore';
import { useUserStore } from '../../stores/userStore';
import { useQueueStore } from '../../stores/queueStore';
import { useRestaurantStore } from '../../stores/restaurantStore';
import { useI18n } from 'vue-i18n';
import QrcodeVue from 'qrcode.vue';

const route = useRoute();
const router = useRouter();
const orderStore = useOrderStore();
const userStore = useUserStore();
const queueStore = useQueueStore();
const restaurantStore = useRestaurantStore();
const restaurantId = route.params.id as string;

const i18n = useI18n();
const locale = i18n?.locale as { value: 'en' | 'th' } | undefined;

let orderSub: (() => void) | null = null;

onMounted(() => {
  if (userStore.user) {
    orderSub = orderStore.subscribeToUserOrders(restaurantId, userStore.user.uid);
  }
});

onUnmounted(() => {
  orderSub?.();
});

const restaurant = computed(() => {
  return restaurantStore.restaurants.find((r: any) => r.id === restaurantId);
});

const checkoutQrValue = computed(() => {
  return JSON.stringify({
    type: 'checkout',
    uid: userStore.user?.uid,
    rid: restaurantId,
    qid: queueStore.activeQueue?.id,
    tid: queueStore.activeQueue?.tableId, // tableId shorthand
    amt: totalAmount.value // amount shorthand
  });
});

const totalAmount = computed(() => {
  return orderStore.currentUserOrders.reduce((sum, order) => sum + order.totalPrice, 0);
});

const getStatusText = (status: string) => {
  switch (status) {
    case 'preparing': return 'กำลังเตรียมอาหาร';
    case 'ready': return 'ทำเสร็จแล้ว';
    case 'served': return 'เสิร์ฟแล้ว';
    case 'completed': return 'ชำระเงินแล้ว';
    default: return status;
  }
};

const formatTime = (timestamp: any) => {
  if (!timestamp) return '--:--';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Joan&display=swap');

.custom-bg { --background: #9A4444; }
.transparent-toolbar { --background: #9A4444; --border-color: transparent; }
.page-title { font-family: 'Inter', sans-serif; font-size: 16px; color: #FFFFFF; }

.ticket-wrapper { display: flex; justify-content: center; padding: 10px 20px 40px 20px; width: 100%; min-height: 100%; }
.ticket-card { background: #FFFFFF; border-radius: 15px; width: 100%; max-width: 400px; padding: 20px; display: flex; flex-direction: column; box-shadow: 0px 4px 15px rgba(0,0,0,0.2); }

.brand-logo { background: #9A4444; color: white; width: 90px; padding: 8px; border-radius: 8px; display: flex; flex-direction: column; align-items: center; justify-content: center; margin-bottom: 20px; }
.small-txt { font-size: 6px; font-family: 'Inter', sans-serif; }
.x-mark { font-size: 8px; margin: 2px 0; }
.big-txt { font-family: 'Joan', serif; font-size: 16px; font-weight: bold; }

.qr-section { display: flex; flex-direction: column; align-items: center; margin-bottom: 25px; gap: 10px; }
.qr-label { font-family: 'Inter', sans-serif; font-size: 14px; color: #666; font-weight: 500; margin: 0; }
.qr-code { border: 8px solid #f8f8f8; border-radius: 12px; }
.table-badge { background: #f0fdf4; border: 1px solid #22c55e; color: #16a34a; padding: 6px 16px; border-radius: 20px; font-size: 14px; font-weight: bold; }
.table-badge span { font-size: 20px; color: #9A4444; margin-left: 5px; }

.section-title { font-family: 'Inter', sans-serif; font-size: 18px; font-weight: bold; color: #000; margin: 20px 0 15px 0; border-top: 1px dashed #ddd; padding-top: 15px; }

.restaurant-row { display: flex; align-items: center; gap: 15px; margin-bottom: 20px; }
.avatar { width: 45px; height: 45px; border-radius: 50%; overflow: hidden; background: #eee; }
.avatar img { width: 100%; height: 100%; object-fit: cover; }
.res-details h3 { margin: 0; font-size: 15px; font-weight: bold; }
.res-details p { margin: 2px 0 0 0; font-size: 12px; color: #666; display: flex; align-items: center; gap: 4px; }

.batches-list { display: flex; flex-direction: column; gap: 20px; margin-bottom: 25px; }
.order-batch { background: #fcfcfc; border: 1px solid #efefef; border-radius: 12px; overflow: hidden; }
.batch-header { background: #f8f8f8; padding: 10px 15px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px dashed #eee; }
.batch-time { font-size: 11px; color: #888; font-family: 'Inter', sans-serif; }
.batch-status { font-size: 12px; font-weight: bold; padding: 4px 10px; border-radius: 12px; font-family: 'Inter', sans-serif; }
.batch-status.preparing { background: #fff8eb; color: #f39c12; }
.batch-status.ready { background: #e8f5e9; color: #27ae60; }
.batch-status.served { background: #ebf5fb; color: #3498db; }

.batch-items { padding: 15px; display: flex; flex-direction: column; gap: 8px; }
.item-row { display: flex; align-items: center; gap: 10px; font-family: 'Joan', serif; }
.qty { font-weight: bold; color: #9A4444; font-size: 15px; }
.name { flex: 1; color: #333; font-size: 15px; }
.price { color: #888; font-size: 13px; }

.total-summary { border-top: 2px solid #f5f5f5; padding-top: 15px; margin-bottom: 25px; }
.summary-line { display: flex; justify-content: space-between; align-items: center; }
.summary-line span:first-child { font-family: 'Inter', sans-serif; font-size: 14px; color: #666; }
.total-price { font-family: 'Inter', sans-serif; font-size: 24px; font-weight: bold; color: #000; }

.order-more-btn { background: #2ecc71; color: white; padding: 12px; border-radius: 30px; font-weight: bold; border: none; display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%; box-shadow: 0 4px 10px rgba(46, 204, 113, 0.2); }
.order-more-btn:active { transform: scale(0.98); }

.center-content { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 70vh; color: white; text-align: center; }
.empty-state h3 { font-size: 20px; font-weight: bold; margin: 15px 0 5px 0; }
.find-res-btn { background: white; color: #9A4444; padding: 10px 25px; border-radius: 20px; margin-top: 20px; font-weight: bold; }
</style>

