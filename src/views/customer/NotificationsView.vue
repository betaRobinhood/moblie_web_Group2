<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar class="custom-toolbar">
        <ion-title class="header-title">ประวัติการใช้งาน</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="custom-bg">
      <div class="content-wrapper">
        
        <div v-if="loading" class="empty-state">
          <ion-spinner name="crescent" color="primary"></ion-spinner>
          <p>กำลังโหลดประวัติ...</p>
        </div>

        <div v-else-if="history.length === 0" class="empty-state">
          <ion-icon :icon="calendarOutline" class="empty-icon"></ion-icon>
          <p>คุณยังไม่มีประวัติการเข้าใช้งาน</p>
        </div>

        <div class="history-list" v-else>
          <div v-for="item in history" :key="item.id" class="history-card" @click="showDetails(item)">
            <div class="history-top">
              <div class="restaurant-info">
                <h2 class="res-name">{{ item.restaurantName || 'ร้านอาหาร' }}</h2>
                <span class="visit-date">{{ formatDate(item.completedAt || item.createdAt) }}</span>
              </div>
              <div class="chevron">
                <ion-icon :icon="chevronForwardOutline"></ion-icon>
              </div>
            </div>

            <div class="history-details">
              <div class="detail-item">
                <ion-icon :icon="peopleOutline"></ion-icon>
                <span>Party of {{ item.partySize }}</span>
              </div>
              <div class="total-spent">
                <span class="label">ยอดรวม: </span>
                <span class="value">{{ item.totalAmount || 0 }} THB</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonIcon, IonSpinner,
  modalController
} from '@ionic/vue';
import { calendarOutline, chevronForwardOutline, peopleOutline } from 'ionicons/icons';
import { db } from '../../services/firebase';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { useUserStore } from '../../stores/userStore';
import HistoryDetailModal from '../../components/HistoryDetailModal.vue';

const userStore = useUserStore();
const history = ref<any[]>([]);
const loading = ref(true);
let historySub: any = null;

const loadHistory = () => {
  if (!userStore.user?.uid) {
    loading.value = false;
    return;
  }
  
  loading.value = true;
  const q = query(
    collection(db, 'queues'),
    where('userId', '==', userStore.user.uid),
    where('status', '==', 'completed'),
    orderBy('createdAt', 'desc')
  );

  if (historySub) historySub();

  historySub = onSnapshot(q, (snapshot) => {
    history.value = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
    loading.value = false;
  }, (err) => {
    console.error('History sub error', err);
    loading.value = false;
  });
};

onMounted(() => loadHistory());

watch(() => userStore.user, (newVal) => {
  if (newVal) loadHistory();
});

onUnmounted(() => {
  if (historySub) historySub();
});

const showDetails = async (item: any) => {
  const modal = await modalController.create({
    component: HistoryDetailModal,
    componentProps: {
      restaurantId: item.restaurantId,
      queueId: item.id,
      totalAmount: item.totalAmount || 0
    }
  });
  await modal.present();
};

const formatDate = (timestamp: any) => {
  if (!timestamp) return '';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'short',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Joan&display=swap');

.custom-toolbar {
  --background: #9A4444;
  --color: white;
  padding: 5px 0;
}
.header-title {
  font-family: 'Joan', serif;
  font-size: 20px;
  text-align: center;
}

.custom-bg {
  --background: #f8f9fa;
}
.content-wrapper {
  padding: 15px;
}

/* ================== Empty State ================== */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 60vh;
  color: #888;
}
.empty-icon { font-size: 60px; color: #ddd; margin-bottom: 15px; }
.empty-state p { font-family: 'Inter', sans-serif; font-size: 15px; }

/* ================== History Cards ================== */
.history-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.history-card {
  background: #ffffff;
  border-radius: 20px;
  padding: 20px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.05);
  cursor: pointer;
  transition: transform 0.2s;
}
.history-card:active { transform: scale(0.98); }

.history-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.res-name {
  font-family: 'Joan', serif;
  font-size: 20px;
  font-weight: bold;
  color: #1a0f0f;
  margin: 0;
}

.visit-date {
  font-size: 13px;
  color: #999;
  font-family: 'Inter', sans-serif;
}

.chevron {
  color: #9A4444;
  font-size: 20px;
}

.history-details {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 12px;
  border-top: 1px solid #f5f5f5;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: #666;
}

.total-spent {
  font-family: 'Joan', serif;
}
.total-spent .label {
  font-size: 14px;
  color: #333;
}
.total-spent .value {
  font-size: 18px;
  font-weight: bold;
  color: #9A4444;
}
</style>