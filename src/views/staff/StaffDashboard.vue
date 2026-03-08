<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button router-link="/profile" fill="clear">
            <ion-icon :icon="personCircleOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
        <ion-title>Staff Dashboard</ion-title>
        <ion-buttons slot="end">
          <ion-button router-link="/staff/management" fill="clear">
            <ion-icon :icon="settingsOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
      <ion-toolbar>
        <ion-segment v-model="activeTab">
          <ion-segment-button value="queue">
            <ion-icon :icon="peopleOutline"></ion-icon>
            <ion-label>Queue <ion-badge v-if="waitingQueue.length > 0" color="danger">{{ waitingQueue.length }}</ion-badge></ion-label>
          </ion-segment-button>
          <ion-segment-button value="orders">
            <ion-icon :icon="fastFoodOutline"></ion-icon>
            <ion-label>Orders <ion-badge v-if="orderStore.activeStaffOrders.length > 0" color="warning">{{ orderStore.activeStaffOrders.length }}</ion-badge></ion-label>
          </ion-segment-button>
          <ion-segment-button value="tables">
            <ion-icon :icon="gridOutline"></ion-icon>
            <ion-label>Tables</ion-label>
          </ion-segment-button>
        </ion-segment>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <!-- ===== QUEUE TAB ===== -->
      <div v-if="activeTab === 'queue'">
        <!-- existing queue content -->
        <div v-if="waitingQueue.length === 0" class="empty-state ion-padding ion-text-center">
          <ion-icon :icon="peopleOutline" size="large" color="medium"></ion-icon>
          <p>No customers in queue</p>
        </div>

        <ion-list v-else>
          <ion-item-sliding v-for="q in waitingQueue" :key="q.id">
            <ion-item>
              <ion-label>
                <h2>Party of {{ q.partySize }}</h2>
                <p>{{ q.userId }}</p>
              </ion-label>
              <ion-badge slot="end" :color="q.status === 'called' ? 'warning' : 'primary'">
                {{ q.status }}
              </ion-badge>
            </ion-item>
            <ion-item-options side="end">
              <ion-item-option color="success" @click="callCustomer(q.id)">
                <ion-icon :icon="callOutline" slot="icon-only"></ion-icon>
              </ion-item-option>
              <ion-item-option color="danger" @click="skipCustomer(q.id)">
                <ion-icon :icon="playSkipForwardOutline" slot="icon-only"></ion-icon>
              </ion-item-option>
            </ion-item-options>
          </ion-item-sliding>
        </ion-list>
      </div>

      <!-- ===== ORDERS TAB ===== -->
      <div v-if="activeTab === 'orders'">
        <div v-if="orderStore.activeStaffOrders.length === 0" class="empty-state ion-padding ion-text-center">
          <ion-icon :icon="fastFoodOutline" size="large" color="medium"></ion-icon>
          <p>No active orders</p>
        </div>

        <ion-list v-else>
          <ion-card v-for="order in orderStore.activeStaffOrders" :key="order.id" class="order-staff-card">
            <ion-card-header>
              <div class="card-header-row">
                <ion-badge :color="order.status === 'preparing' ? 'warning' : 'success'">
                  {{ order.status.toUpperCase() }}
                </ion-badge>
                <span class="time-txt">{{ formatTime(order.createdAt) }}</span>
              </div>
              <ion-card-title>Table {{ order.tableNumber || '?' }}</ion-card-title>
            </ion-card-header>

            <ion-card-content>
              <div v-for="item in order.items" :key="item.menuItemId" class="order-item-list">
                <span class="qty">{{ item.quantity }}x</span>
                <span class="name">{{ item.name[locale?.value || 'en'] || item.name['en'] }}</span>
              </div>

              <div class="order-actions-row">
                <ion-button v-if="order.status === 'preparing'" color="success" size="small" @click="updateStatus(order.id, 'ready')">
                  <ion-icon :icon="checkmarkDoneOutline" slot="start"></ion-icon>
                  Mark as Ready
                </ion-button>
                <ion-button v-if="order.status === 'ready'" color="primary" size="small" @click="updateStatus(order.id, 'served')">
                  <ion-icon :icon="restaurantOutline" slot="start"></ion-icon>
                  Served
                </ion-button>
              </div>
            </ion-card-content>
          </ion-card>
        </ion-list>
      </div>

      <!-- ===== TABLES TAB ===== -->
      <div v-if="activeTab === 'tables'" class="tables-grid-container ion-padding">
        <!-- existing tables content -->
        <div v-if="tables.length === 0" class="empty-state ion-text-center">
          <ion-icon :icon="gridOutline" size="large" color="medium"></ion-icon>
          <p>No tables yet. <a @click="router.push('/staff/tables')">Add tables →</a></p>
        </div>

        <div class="tables-grid" v-else>
          <div
            v-for="table in tables"
            :key="table.id"
            class="table-card"
            :class="table.occupied ? 'occupied' : 'available'"
            @click="handleTableClick(table)"
          >
            <div class="table-number">{{ table.number }}</div>
            <ion-icon :icon="table.occupied ? 'person' : 'personOutline'" class="table-icon"></ion-icon>
            <div class="table-capacity">{{ table.capacity }} seats</div>
            <div class="table-status-badge">{{ table.occupied ? 'Occupied' : 'Available' }}</div>
            <ion-button
              v-if="table.occupied"
              size="small"
              fill="outline"
              color="medium"
              class="free-btn"
              @click.stop="freeTable(table)"
            >
              Free Table
            </ion-button>
          </div>
        </div>

        <ion-fab vertical="bottom" horizontal="end" slot="fixed">
          <ion-fab-button @click="router.push('/staff/tables')" color="primary" size="small">
            <ion-icon :icon="addOutline"></ion-icon>
          </ion-fab-button>
        </ion-fab>
      </div>

      <!-- FAB for scanner -->
      <ion-fab vertical="bottom" horizontal="end" slot="fixed">
        <ion-fab-button @click="openScanner" color="primary">
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
  IonItemSliding, IonItemOptions, IonItemOption,
  IonFab, IonFabButton, IonCard, IonCardHeader, IonCardTitle, IonCardContent,
  modalController, toastController
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
let queueSub: (() => void) | null = null;
let tablesSub: (() => void) | null = null;
let orderSub: (() => void) | null = null;

const restaurantId = computed(() => userStore.profile?.restaurantId || 'DEMO_REST_ID');

const startSubscriptions = (id: string) => {
  stopSubscriptions();
  console.log('Starting staff subscriptions for:', id);

  // Subscribe to queue
  const q = query(
    collection(db, 'queues'),
    where('restaurantId', '==', id),
    where('status', 'in', ['waiting', 'called']),
    orderBy('createdAt', 'asc')
  );
  queueSub = onSnapshot(q, (snap) => {
    waitingQueue.value = snap.docs.map(d => ({ id: d.id, ...d.data() } as QueueEntry));
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
.tables-grid-container {
  padding: 16px;
}

.tables-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
  gap: 16px;
}

.table-card {
  border-radius: 12px;
  padding: 16px 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.table-card:active {
  transform: scale(0.96);
}

.table-card.available {
  background: #f0fdf4;
  border: 2px solid #22c55e;
}

.table-card.occupied {
  background: #fff1f2;
  border: 2px solid #ef4444;
  cursor: default;
}

.table-number {
  font-size: 28px;
  font-weight: bold;
  color: #1a1a1a;
}

.table-icon {
  font-size: 24px;
}

.available .table-icon { color: #22c55e; }
.occupied .table-icon { color: #ef4444; }

.table-capacity {
  font-size: 12px;
  color: #666;
}

.table-status-badge {
  font-size: 11px;
  font-weight: bold;
  padding: 2px 8px;
  border-radius: 99px;
}

.available .table-status-badge {
  background: #dcfce7;
  color: #16a34a;
}

.occupied .table-status-badge {
  background: #fee2e2;
  color: #dc2626;
}

.free-btn {
  margin-top: 4px;
  font-size: 11px;
  height: 28px;
}

.empty-state {
  padding-top: 60px;
}

.empty-state p {
  color: #888;
  margin-top: 12px;
}

.order-staff-card {
  margin: 15px;
  border-radius: 12px;
  box-shadow: 0 4px 10px rgba(0,0,0,0.05);
}

.card-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.time-txt {
  font-size: 12px;
  color: #999;
}

.order-item-list {
  display: flex;
  gap: 10px;
  padding: 8px 0;
  border-bottom: 1px dashed #eee;
  font-size: 15px;
}

.order-item-list .qty {
  font-weight: bold;
  color: #9A4444;
}

.order-actions-row {
  display: flex;
  justify-content: flex-end;
  margin-top: 15px;
}
</style>
