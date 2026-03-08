<template>
  <ion-header>
    <ion-toolbar>
      <ion-title>Check Out - Table {{ tableNumber }}</ion-title>
      <ion-buttons slot="end">
        <ion-button @click="dismiss()">
          <ion-icon :icon="closeOutline"></ion-icon>
        </ion-button>
      </ion-buttons>
    </ion-toolbar>
  </ion-header>
  <ion-content class="ion-padding">
    <div v-if="loading" class="ion-text-center ion-padding">
      <ion-spinner name="crescent"></ion-spinner>
    </div>

    <div v-else>
      <div class="checkout-summary">
        <h2 class="section-title">สรุปรายการอาหาร</h2>
        <div class="items-list">
          <div v-for="order in activeOrders" :key="order.id" class="order-batch">
            <div class="batch-time">Order Time: {{ formatTime(order.createdAt) }}</div>
            <div v-for="item in order.items" :key="item.menuItemId" class="item-row">
              <span class="qty">{{ item.quantity }}x</span>
              <span class="name">{{ item.name[locale?.value || 'en'] || item.name['en'] }}</span>
              <span class="price">{{ item.price * item.quantity }} THB</span>
            </div>
          </div>
        </div>

        <div class="total-section">
          <div class="total-row">
            <span>ยอดรวมทั้งหมด</span>
            <span class="grand-total">{{ totalAmount }} THB</span>
          </div>
        </div>
      </div>

      <div class="actions">
        <div v-if="hasPendingOrders" class="warning-box ion-padding">
          <ion-icon :icon="warningOutline" color="warning"></ion-icon>
          <p>ยังมีรายการที่ยังไม่ได้เสิร์ฟ กรุณาเสิร์ฟอาหารให้ครบทุกรายการก่อนเช็คเอาต์</p>
        </div>

        <ion-button expand="block" color="danger" @click="confirmCheckout" :disabled="checkingOut || hasPendingOrders">
          <ion-spinner v-if="checkingOut" name="crescent"></ion-spinner>
          <span v-else>ยืนยันการชำระเงิน & คืนโต๊ะ</span>
        </ion-button>
      </div>
    </div>
  </ion-content>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton,
  IonSpinner, IonIcon, modalController, toastController
} from '@ionic/vue';
import { closeOutline, warningOutline } from 'ionicons/icons';
import { db } from '../services/firebase';
import {
  collection, query, where, getDocs, doc, writeBatch, serverTimestamp
} from 'firebase/firestore';
import { useI18n } from 'vue-i18n';

const props = defineProps<{
  restaurantId: string;
  userId: string;
  tableNumber: number;
  tableId: string;
  queueId: string;
}>();

const i18n = useI18n();
const locale = i18n?.locale as { value: 'en' | 'th' } | undefined;

const activeOrders = ref<any[]>([]);
const loading = ref(true);
const checkingOut = ref(false);

const totalAmount = computed(() => {
  return activeOrders.value.reduce((sum, order) => sum + order.totalPrice, 0);
});

const hasPendingOrders = computed(() => {
  return activeOrders.value.some(order => order.status === 'preparing' || order.status === 'ready');
});

onMounted(async () => {
  try {
    const q = query(
      collection(db, `restaurants/${props.restaurantId}/orders`),
      where('userId', '==', props.userId),
      where('status', 'in', ['preparing', 'ready', 'served'])
    );
    const snap = await getDocs(q);
    activeOrders.value = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (e) {
    console.error('Fetch active orders error', e);
  } finally {
    loading.value = false;
  }
});

const confirmCheckout = async () => {
  checkingOut.value = true;
  try {
    const batch = writeBatch(db);
    
    // 1. Mark orders as completed
    activeOrders.value.forEach(order => {
      const orderRef = doc(db, `restaurants/${props.restaurantId}/orders`, order.id);
      batch.update(orderRef, { status: 'completed' });
    });

    // 2. Mark queue as completed
    const queueRef = doc(db, 'queues', props.queueId);
    batch.update(queueRef, { status: 'completed', completedAt: serverTimestamp() });

    // 3. Mark table as available
    const tableRef = doc(db, `restaurants/${props.restaurantId}/tables`, props.tableId);
    batch.update(tableRef, { occupied: false, currentQueueId: null });

    await batch.commit();

    const toast = await toastController.create({
      message: `Checkout successful for Table ${props.tableNumber}`,
      duration: 2000,
      color: 'success',
      position: 'top'
    });
    await toast.present();
    
    modalController.dismiss({ success: true });
  } catch (e) {
    console.error('Checkout error', e);
    const toast = await toastController.create({
      message: 'Failed to process checkout.',
      duration: 2000,
      color: 'danger'
    });
    await toast.present();
  } finally {
    checkingOut.value = false;
  }
};

const formatTime = (timestamp: any) => {
  if (!timestamp) return '--:--';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const dismiss = () => modalController.dismiss();
</script>

<style scoped>
.section-title { font-family: 'Joan', serif; font-size: 20px; font-weight: bold; margin-bottom: 20px; color: #000; }
.order-batch { margin-bottom: 20px; border-bottom: 1px dashed #eee; padding-bottom: 15px; }
.batch-time { font-size: 12px; color: #888; margin-bottom: 8px; }
.item-row { display: flex; align-items: center; gap: 10px; margin-bottom: 5px; font-size: 15px; }
.qty { font-weight: bold; color: #9A4444; }
.name { flex: 1; }
.price { color: #666; font-size: 14px; }

.total-section { margin-top: 20px; padding-top: 20px; border-top: 2px solid #333; }
.total-row { display: flex; justify-content: space-between; align-items: center; font-family: 'Joan', serif; }
.total-row span:first-child { font-size: 18px; font-weight: bold; }
.grand-total { font-size: 24px; font-weight: bold; color: #9A4444; }

.warning-box {
  background: #fff8eb;
  border: 1px solid #f39c12;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  margin-bottom: 15px;
  text-align: center;
}
.warning-box p {
  margin: 0;
  font-size: 14px;
  color: #d35400;
  font-weight: 500;
}
.warning-box ion-icon {
  font-size: 32px;
}

.actions { margin-top: 40px; }
</style>
