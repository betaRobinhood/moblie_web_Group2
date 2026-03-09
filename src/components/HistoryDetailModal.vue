<template>
  <ion-header class="ion-no-border">
    <ion-toolbar class="detail-toolbar">
      <ion-title>รายการคำสั่งซื้อ</ion-title>
      <ion-buttons slot="end">
        <ion-button @click="dismiss()">
          <ion-icon :icon="closeOutline"></ion-icon>
        </ion-button>
      </ion-buttons>
    </ion-toolbar>
  </ion-header>
  
  <ion-content class="ion-padding custom-content">
    <div v-if="loading" class="ion-text-center ion-padding">
      <ion-spinner name="crescent" color="primary"></ion-spinner>
    </div>
    
    <div v-else>
      <div v-for="order in orders" :key="order.id" class="history-order-card">
        <div class="batch-header">
          <ion-badge color="success">เสร็จสมบูรณ์</ion-badge>
          <span class="batch-time">{{ formatTime(order.createdAt) }}</span>
        </div>
        
        <div class="items-container">
          <div v-for="(item, idx) in order.items" :key="idx" class="item-line">
            <span class="item-qty">{{ item.quantity }}x</span>
            <span class="item-name">{{ getName(item) }}</span>
            <span class="item-price">{{ (item.price * item.quantity).toFixed(0) }} THB</span>
          </div>
        </div>
        <div class="batch-total">
          ยอดรวมชุดนี้: {{ order.totalPrice.toFixed(0) }} THB
        </div>
      </div>
      
      <div class="grand-total-section">
        <div class="dashed-line"></div>
        <div class="summary-row">
          <span>ยอดรวมทั้งหมดของมื้อนี้</span>
          <span class="amount">{{ totalAmount }} THB</span>
        </div>
      </div>
    </div>
  </ion-content>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton,
  IonIcon, IonSpinner, IonBadge, modalController
} from '@ionic/vue';
import { closeOutline } from 'ionicons/icons';
import { db } from '../services/firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { useI18n } from 'vue-i18n';

const props = defineProps<{
  restaurantId: string;
  queueId: string;
  totalAmount: number | string;
}>();

const i18n = useI18n();
const locale = i18n?.locale as { value: 'en' | 'th' } | undefined;

const orders = ref<any[]>([]);
const loading = ref(true);

onMounted(async () => {
  try {
    const q = query(
      collection(db, `restaurants/${props.restaurantId}/orders`),
      where('queueId', '==', props.queueId),
      orderBy('createdAt', 'asc')
    );
    const snap = await getDocs(q);
    orders.value = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (e) {
    console.error('Fetch history details error', e);
  } finally {
    loading.value = false;
  }
});

const getName = (item: any) => {
  return item.name[locale?.value || 'en'] || item.name['en'] || 'Unknown';
};

const formatTime = (timestamp: any) => {
  if (!timestamp) return '';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const dismiss = () => modalController.dismiss();
</script>

<style scoped>
.detail-toolbar {
  --background: #9A4444;
  --color: white;
}

.custom-content {
  --background: #fdfdfd;
}

.history-order-card {
  background: white;
  border-radius: 12px;
  padding: 15px;
  margin-bottom: 15px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  border: 1px solid #f0f0f0;
}

.batch-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  border-bottom: 1px dashed #eee;
  padding-bottom: 8px;
}

.batch-time {
  font-size: 12px;
  color: #999;
}

.items-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.item-line {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
}

.item-qty {
  font-weight: bold;
  color: #9A4444;
  margin-right: 8px;
}

.item-name {
  flex: 1;
}

.item-price {
  color: #666;
}

.batch-total {
  margin-top: 12px;
  text-align: right;
  font-size: 13px;
  color: #333;
  font-weight: 600;
}

.grand-total-section {
  margin-top: 30px;
  padding: 0 10px;
}

.dashed-line {
  border-top: 2px dashed #9A4444;
  margin-bottom: 15px;
  opacity: 0.3;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-family: 'Joan', serif;
  font-weight: bold;
}

.summary-row span:first-child {
  font-size: 16px;
  color: #333;
}

.amount {
  font-size: 22px;
  color: #9A4444;
}
</style>
