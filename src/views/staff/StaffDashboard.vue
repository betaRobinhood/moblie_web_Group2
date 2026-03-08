<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar class="custom-toolbar">
        <ion-buttons slot="start">
          <ion-button router-link="/profile" color="light">
            <ion-icon :icon="personCircleOutline" class="header-icon"></ion-icon>
          </ion-button>
        </ion-buttons>
        <ion-title class="header-title">Staff Dashboard</ion-title>
        <ion-buttons slot="end">
          <ion-button router-link="/staff/management" color="light">
            <ion-icon :icon="settingsOutline" class="header-icon"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>

      <ion-toolbar class="segment-toolbar">
        <ion-segment v-model="activeTab" class="custom-segment">
          <ion-segment-button value="queue">
            <div class="segment-content">
              <ion-icon :icon="peopleOutline"></ion-icon>
              <ion-label>Queue</ion-label>
              <span v-if="waitingQueue.length > 0" class="badge-dot">{{ waitingQueue.length }}</span>
            </div>
          </ion-segment-button>
          
          <ion-segment-button value="orders">
            <div class="segment-content">
              <ion-icon :icon="fastFoodOutline"></ion-icon>
              <ion-label>Orders</ion-label>
              <span v-if="orderStore.activeStaffOrders.length > 0" class="badge-dot warning-dot">{{ orderStore.activeStaffOrders.length }}</span>
            </div>
          </ion-segment-button>
          
          <ion-segment-button value="tables">
            <div class="segment-content">
              <ion-icon :icon="gridOutline"></ion-icon>
              <ion-label>Tables</ion-label>
            </div>
          </ion-segment-button>
        </ion-segment>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true" class="custom-background">
      
      <div v-if="activeTab === 'queue'" class="tab-content">
        <div v-if="loadingQueue" class="empty-state">
          <ion-spinner name="crescent" class="custom-spinner"></ion-spinner>
          <p style="margin-top: 15px; color: #888;">กำลังโหลดข้อมูลคิว...</p>
        </div>

        <div v-else-if="waitingQueue.length === 0" class="empty-state">
          <ion-icon :icon="peopleOutline" class="empty-icon"></ion-icon>
          <h3>No customers in queue</h3>
          <p>The queue is currently empty.</p>
        </div>

        <ion-list v-else class="custom-list">
          <ion-item-sliding v-for="q in waitingQueue" :key="q.id" class="sliding-card">
            <ion-item lines="none" class="queue-item">
              <ion-label>
                <h2 class="party-title">Party of {{ q.partySize }}</h2>
                <p class="user-id-txt">ID: {{ q.userId.substring(0, 8) }}...</p>
              </ion-label>
              <ion-badge slot="end" :color="q.status === 'called' ? 'warning' : 'primary'" class="status-badge">
                {{ q.status.toUpperCase() }}
              </ion-badge>
            </ion-item>
            
            <ion-item-options side="end">
              <ion-item-option color="success" @click="callCustomer(q.id)" class="action-opt">
                <ion-icon :icon="callOutline" slot="icon-only" class="opt-icon"></ion-icon>
              </ion-item-option>
              <ion-item-option color="danger" @click="skipCustomer(q.id)" class="action-opt">
                <ion-icon :icon="playSkipForwardOutline" slot="icon-only" class="opt-icon"></ion-icon>
              </ion-item-option>
            </ion-item-options>
          </ion-item-sliding>
        </ion-list>
      </div>

      <div v-if="activeTab === 'orders'" class="tab-content">
        <div v-if="orderStore.activeStaffOrders.length === 0" class="empty-state">
          <ion-icon :icon="fastFoodOutline" class="empty-icon"></ion-icon>
          <h3>No active orders</h3>
          <p>Kitchen is clear.</p>
        </div>

        <div v-else class="orders-container">
          <div v-for="order in orderStore.activeStaffOrders" :key="order.id" class="order-staff-card">
            <div class="card-header-row">
              <div class="table-info">
                <span class="table-label">TABLE</span>
                <span class="table-number">{{ order.tableNumber || '?' }}</span>
              </div>
              <div class="status-time">
                <ion-badge :color="order.status === 'preparing' ? 'warning' : 'success'" class="order-badge">
                  {{ order.status.toUpperCase() }}
                </ion-badge>
                <span class="time-txt">{{ formatTime(order.createdAt) }}</span>
              </div>
            </div>

            <div class="order-items-container">
              <div v-for="item in order.items" :key="item.menuItemId" class="order-item-list">
                <span class="qty">{{ item.quantity }}x</span>
                <span class="name">{{ item.name[locale?.value || 'en'] || item.name['en'] }}</span>
              </div>
            </div>

            <div class="order-actions-row">
              <button v-if="order.status === 'preparing'" class="action-btn btn-ready" @click="updateStatus(order.id, 'ready')">
                <ion-icon :icon="checkmarkDoneOutline"></ion-icon> Mark as Ready
              </button>
              <button v-if="order.status === 'ready'" class="action-btn btn-served" @click="updateStatus(order.id, 'served')">
                <ion-icon :icon="restaurantOutline"></ion-icon> Served
              </button>
            </div>
          </div>
        </div>
      </div>

      <div v-if="activeTab === 'tables'" class="tab-content">
        <div v-if="loadingTables" class="empty-state">
          <ion-spinner name="crescent" class="custom-spinner"></ion-spinner>
          <p style="margin-top: 15px; color: #888;">กำลังโหลดข้อมูลโต๊ะ...</p>
        </div>

        <div v-else-if="tables.length === 0" class="empty-state">
          <ion-icon :icon="gridOutline" class="empty-icon"></ion-icon>
          <h3>No tables yet</h3>
          <p><a @click="router.push('/staff/tables')" class="link-txt">Add tables →</a></p>
        </div>

        <div class="tables-grid" v-else>
          <div
            v-for="table in tables"
            :key="table.id"
            class="table-card"
            :class="table.occupied ? 'occupied' : 'available'"
            @click="handleTableClick(table)"
          >
            <div class="table-header">
              <ion-icon :icon="table.occupied ? 'person' : 'personOutline'" class="table-icon"></ion-icon>
              <div class="table-status-badge">{{ table.occupied ? 'Occupied' : 'Available' }}</div>
            </div>
            
            <div class="table-number">{{ table.number }}</div>
            <div class="table-capacity">{{ table.capacity }} seats</div>
            
            <button
              v-if="table.occupied"
              class="free-btn"
              @click.stop="freeTable(table)"
            >
              Free Table
            </button>
          </div>
        </div>
      </div>

      <ion-fab v-if="activeTab === 'tables'" vertical="bottom" horizontal="start" slot="fixed">
        <ion-fab-button @click="router.push('/staff/tables')" class="custom-fab-add">
          <ion-icon :icon="addOutline"></ion-icon>
        </ion-fab-button>
      </ion-fab>

      <ion-fab vertical="bottom" horizontal="end" slot="fixed">
        <ion-fab-button @click="openScanner" class="custom-fab-scanner">
          <ion-icon :icon="qrCodeOutline"></ion-icon>
        </ion-fab-button>
      </ion-fab>
      
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from 'vue';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonSegment, IonSegmentButton,
  IonList, IonItem, IonLabel, IonBadge, IonIcon, IonButtons, IonButton,
  IonItemSliding, IonItemOptions, IonItemOption, IonSpinner,
  IonFab, IonFabButton, modalController, toastController
} from '@ionic/vue';
import {
  qrCodeOutline, settingsOutline, callOutline, playSkipForwardOutline,
  peopleOutline, personCircleOutline, gridOutline, addOutline, fastFoodOutline,
  checkmarkDoneOutline, restaurantOutline
} from 'ionicons/icons';
import { db } from '../../services/firebase';
import {
  collection, query, where, orderBy, onSnapshot, doc, updateDoc
} from 'firebase/firestore';
import { useRouter } from 'vue-router';
import type { QueueEntry } from '../../models/types';
import { useUserStore } from '../../stores/userStore';
import { useOrderStore } from '../../stores/orderStore';
import { useI18n } from 'vue-i18n';
import QueueToTableModal from '../../components/QueueToTableModal.vue';

const router = useRouter();
const userStore = useUserStore();
const orderStore = useOrderStore();
const i18n = useI18n();
const locale = i18n?.locale as { value: 'en' | 'th' } | undefined;

const activeTab = ref('queue');
const waitingQueue = ref<QueueEntry[]>([]);
const tables = ref<Array<{ id: string; number: number; capacity: number; occupied: boolean; currentQueueId?: string | null }>>([]);

// เพิ่ม State สำหรับจัดการ Loading
const loadingQueue = ref(true);
const loadingTables = ref(true);

let queueSub: (() => void) | null = null;
let tablesSub: (() => void) | null = null;
let orderSub: (() => void) | null = null;

const restaurantId = computed(() => userStore.profile?.restaurantId || 'DEMO_REST_ID');

const startSubscriptions = (id: string) => {
  stopSubscriptions();
  console.log('Starting staff subscriptions for:', id);

  loadingQueue.value = true;
  loadingTables.value = true;

  // Subscribe to queue
  const q = query(
    collection(db, 'queues'),
    where('restaurantId', '==', id),
    where('status', 'in', ['waiting', 'called']),
    orderBy('createdAt', 'asc')
  );
  queueSub = onSnapshot(q, (snap) => {
    waitingQueue.value = snap.docs.map(d => ({ id: d.id, ...d.data() } as QueueEntry));
    loadingQueue.value = false; // ปิด loading เมื่อโหลดเสร็จ
  }, (err) => console.error('Queue sub error:', err));

  // Subscribe to orders
  orderSub = orderStore.subscribeToStaffOrders(id);

  // Subscribe to tables
  const tq = query(collection(db, `restaurants/${id}/tables`));
  tablesSub = onSnapshot(tq, (snap) => {
    tables.value = snap.docs.map(d => ({
      id: d.id,
      number: (d.data() as any).number,
      capacity: (d.data() as any).capacity,
      occupied: (d.data() as any).occupied,
      currentQueueId: (d.data() as any).currentQueueId
    })).sort((a, b) => a.number - b.number);
    loadingTables.value = false; // ปิด loading เมื่อโหลดเสร็จ
  }, (err) => console.error('Tables sub error:', err));
};

const stopSubscriptions = () => {
  queueSub?.();
  tablesSub?.();
  orderSub?.();
  queueSub = null;
  tablesSub = null;
  orderSub = null;
};

onMounted(() => {
  if (restaurantId.value) {
    startSubscriptions(restaurantId.value);
  }
});

watch(restaurantId, (newId) => {
  if (newId) {
    startSubscriptions(newId);
  } else {
    stopSubscriptions();
  }
});

onUnmounted(() => {
  stopSubscriptions();
});

const callCustomer = async (id: string) => {
  await updateDoc(doc(db, 'queues', id), { status: 'called', calledAt: new Date() });
};

const skipCustomer = async (id: string) => {
  await updateDoc(doc(db, 'queues', id), { status: 'skipped' });
};

const updateStatus = async (orderId: string, status: any) => {
  const result = await orderStore.updateOrderStatus(restaurantId.value, orderId, status);
  if (result.success) {
    const toast = await toastController.create({
      message: `Order marked as ${status}`,
      duration: 1500,
      color: 'success',
      position: 'bottom'
    });
    await toast.present();
  }
};

const formatTime = (timestamp: any) => {
  if (!timestamp) return '--:--';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const openScanner = () => router.push('/staff/scanner');

const handleTableClick = async (table: any) => {
  if (table.occupied) return; // Do nothing if already occupied

  // Check if there are any 'called' customers to assign
  const calledQ = waitingQueue.value.filter(q => q.status === 'called');
  if (calledQ.length === 0) {
    const toast = await toastController.create({
      message: 'No called customers to assign. Call a customer first.',
      duration: 2500,
      color: 'warning',
      position: 'top'
    });
    await toast.present();
    return;
  }

  const modal = await modalController.create({
    component: QueueToTableModal,
    componentProps: {
      restaurantId: restaurantId.value,
      tableId: table.id,
      tableNumber: table.number
    },
    breakpoints: [0, 0.5, 0.9],
    initialBreakpoint: 0.5
  });
  await modal.present();
};

const freeTable = async (table: any) => {
  await updateDoc(doc(db, `restaurants/${restaurantId.value}/tables`, table.id), {
    occupied: false,
    currentQueueId: null
  });
  const toast = await toastController.create({
    message: `Table ${table.number} is now available.`,
    duration: 2000,
    color: 'success',
    position: 'bottom'
  });
  await toast.present();
};
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Joan&display=swap');

/* ================== Header & Toolbar ================== */
.custom-toolbar {
  --background: #9A4444;
  --color: white;
  padding-top: 5px;
}
.header-title {
  font-family: 'Joan', serif;
  font-size: 24px;
  text-align: center;
}
.header-icon {
  font-size: 28px;
}

/* ================== Segment (Tabs) ================== */
.segment-toolbar {
  --background: #9A4444;
  padding: 0 10px 10px 10px;
}
.custom-segment {
  background: rgba(255, 255, 255, 0.15);
  border-radius: 12px;
  padding: 4px;
}
ion-segment-button {
  --color: rgba(255, 255, 255, 0.7);
  --color-checked: #9A4444;
  --indicator-color: #FFFFFF;
  --border-radius: 10px;
  font-family: 'Inter', sans-serif;
  font-weight: 600;
  min-height: 40px;
}
.segment-content {
  display: flex;
  align-items: center;
  gap: 6px;
  position: relative;
}
.badge-dot {
  background: #e74c3c;
  color: white;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 10px;
  position: absolute;
  top: -8px;
  right: -15px;
}
.warning-dot {
  background: #f1c40f;
  color: #333;
}

/* ================== Background & Layout ================== */
.custom-background {
  --background: #f5f5f5;
}
.tab-content {
  padding: 15px 10px 80px 10px; /* เผื่อที่ให้ปุ่ม FAB ด้านล่าง */
  animation: fadeIn 0.3s ease;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(5px); }
  to { opacity: 1; transform: translateY(0); }
}

/* ================== Empty States & Loaders ================== */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 50vh;
  text-align: center;
  color: #888;
}
.empty-icon {
  font-size: 70px;
  color: #ddd;
  margin-bottom: 15px;
}
.empty-state h3 {
  font-family: 'Joan', serif;
  font-size: 22px;
  color: #555;
  margin: 0;
}
.empty-state p {
  font-family: 'Inter', sans-serif;
  font-size: 14px;
}
.link-txt {
  color: #9A4444;
  font-weight: bold;
  cursor: pointer;
}
.custom-spinner {
  width: 40px;
  height: 40px;
  color: #9A4444;
}

/* ================== Queue List ================== */
.custom-list {
  background: transparent;
}
.sliding-card {
  margin-bottom: 15px;
  border-radius: 15px;
  box-shadow: 0 4px 10px rgba(0,0,0,0.05);
  overflow: hidden;
}
.queue-item {
  --background: #ffffff;
  --padding-start: 15px;
  --padding-top: 10px;
  --padding-bottom: 10px;
}
.party-title {
  font-family: 'Joan', serif;
  font-size: 18px;
  font-weight: bold;
  color: #333;
}
.user-id-txt {
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}
.status-badge {
  font-family: 'Inter', sans-serif;
  font-size: 11px;
  padding: 6px 10px;
  border-radius: 8px;
}
.action-opt {
  padding: 0 20px;
}
.opt-icon {
  font-size: 24px;
}

/* ================== Orders Cards ================== */
.orders-container {
  display: flex;
  flex-direction: column;
  gap: 15px;
}
.order-staff-card {
  background: #ffffff;
  border-radius: 20px;
  padding: 20px;
  box-shadow: 0 5px 15px rgba(0,0,0,0.05);
}
.card-header-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 15px;
  border-bottom: 1px solid #f0f0f0;
  padding-bottom: 15px;
}
.table-info {
  display: flex;
  flex-direction: column;
}
.table-label {
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  color: #999;
  font-weight: 600;
  letter-spacing: 1px;
}
.table-number {
  font-family: 'Joan', serif;
  font-size: 28px;
  font-weight: bold;
  color: #9A4444;
  line-height: 1;
}
.status-time {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 5px;
}
.order-badge {
  border-radius: 8px;
  padding: 6px 10px;
  font-family: 'Inter', sans-serif;
  font-size: 11px;
}
.time-txt {
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  color: #888;
}

.order-items-container {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.order-item-list {
  display: flex;
  gap: 12px;
  font-family: 'Inter', sans-serif;
  font-size: 15px;
  color: #333;
}
.qty {
  font-weight: bold;
  color: #9A4444;
  min-width: 25px;
}

.order-actions-row {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
  padding-top: 15px;
  border-top: 1px dashed #eee;
}
.action-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border-radius: 20px;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  font-weight: 600;
  color: white;
  border: none;
  cursor: pointer;
  transition: transform 0.1s;
}
.action-btn:active { transform: scale(0.95); }
.btn-ready { background: #2ecc71; box-shadow: 0 4px 10px rgba(46, 204, 113, 0.3); }
.btn-served { background: #3498db; box-shadow: 0 4px 10px rgba(52, 152, 219, 0.3); }

/* ================== Tables Grid ================== */
.tables-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 15px;
}
.table-card {
  background: white;
  border-radius: 18px;
  padding: 15px;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  cursor: pointer;
  box-shadow: 0 4px 10px rgba(0,0,0,0.05);
  transition: transform 0.2s, box-shadow 0.2s;
}
.table-card:active { transform: scale(0.96); }

.table-header {
  display: flex;
  justify-content: space-between;
  width: 100%;
  align-items: flex-start;
  margin-bottom: 10px;
}
.table-icon { font-size: 20px; }
.table-status-badge {
  font-family: 'Inter', sans-serif;
  font-size: 10px;
  font-weight: bold;
  padding: 4px 8px;
  border-radius: 10px;
}

.table-number {
  font-family: 'Joan', serif;
  font-size: 36px;
  font-weight: bold;
  line-height: 1;
  margin-bottom: 5px;
}
.table-capacity {
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  color: #888;
}

/* Available Style */
.available { border: 2px solid transparent; }
.available .table-number { color: #333; }
.available .table-icon { color: #2ecc71; }
.available .table-status-badge { background: #e8f8f5; color: #27ae60; }

/* Occupied Style */
.occupied { border: 2px solid #e74c3c; background: #fdf2f0; cursor: default; }
.occupied .table-number { color: #c0392b; }
.occupied .table-icon { color: #e74c3c; }
.occupied .table-status-badge { background: #fadbd8; color: #c0392b; }

.free-btn {
  margin-top: 15px;
  background: white;
  color: #e74c3c;
  border: 1px solid #e74c3c;
  padding: 6px 15px;
  border-radius: 15px;
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  font-weight: 600;
}

/* ================== FAB Buttons ================== */
.custom-fab-scanner {
  --background: #9A4444; 
  --background-activated: #7a3636;
  --color: #ffffff; 
  --box-shadow: 0 4px 15px rgba(154, 68, 68, 0.4);
}
.custom-fab-add {
  --background: #9A4444;
  --background-activated: #7a3636;
  --color: #ffffff;
  --box-shadow: 0 4px 15px rgba(154, 68, 68, 0.4);
}
</style>