<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar class="custom-toolbar">
        <ion-title class="header-title">EzyDine</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true" class="custom-background">
      
      <div v-if="queueStore.activeQueue" class="queue-banner">
        <div class="queue-info">
          <h2>{{ $t('queue.current_position') || 'Current Queue' }}: <span>#{{ queueStore.activeQueue.position }}</span></h2>
          <p>{{ $t('queue.est_wait') || 'Estimated Wait' }}: ~{{ queueStore.activeQueue.estimatedWaitTime }} {{ $t('queue.mins') || 'mins' }}</p>
        </div>
        <button class="view-queue-btn" @click="viewQueue">
          View QR Code
        </button>
      </div>

      <div class="section-header">
        <h2>Explore Restaurants</h2>
        <p>Find your favorite place to dine</p>
      </div>

      <div v-if="restaurantStore.loading" class="loading-container">
        <ion-spinner name="crescent" class="custom-spinner"></ion-spinner>
      </div>

      <div v-else-if="restaurantStore.restaurants.length === 0" class="empty-state">
        <p>No restaurants available at the moment.</p>
      </div>

      <div v-else class="restaurant-list">
        <div 
          v-for="res in restaurantStore.restaurants" 
          :key="res.id" 
          class="restaurant-card"
          @click="goToRestaurant(res.id)"
        >
          <div class="card-image">
            <img :src="res.coverImageUrl || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80'" />
            <div class="status-badge" :class="res.queueEnabled ? 'status-open' : 'status-closed'">
              {{ res.queueEnabled ? 'Open for Queue' : 'Closed' }}
            </div>
          </div>
          <div class="card-content">
            <h3 class="res-name">{{ res.name[locale?.value || 'en'] || res.name['en'] }}</h3>
            <p class="res-desc">{{ res.description[locale?.value || 'en'] || res.description['en'] }}</p>
          </div>
        </div>
      </div>

    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, watch } from 'vue';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonSpinner
} from '@ionic/vue';
import { useRestaurantStore } from '../../stores/restaurantStore';
import { useQueueStore } from '../../stores/queueStore';
import { useUserStore } from '../../stores/userStore';
import { auth } from '../../services/firebase';
import { signOut } from 'firebase/auth';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';

const restaurantStore = useRestaurantStore();
const queueStore = useQueueStore();
const userStore = useUserStore();
const router = useRouter();

// ป้องกันกรณี locale ไม่มีค่า
const i18n = useI18n();
const locale = i18n?.locale as { value: 'en' | 'th' } | undefined;

let restaurantSub: (() => void) | null = null;
let queueSub: (() => void) | null = null;

const subscribeQueue = () => {
  if (userStore.user && !queueSub) {
    queueSub = queueStore.subscribeToUserQueue(userStore.user.uid);
  }
};

onMounted(() => {
  restaurantSub = restaurantStore.subscribeToRestaurants();
  subscribeQueue();
});

// Watch for delayed auth state (Firebase auth is async)
watch(() => userStore.user, () => subscribeQueue());

onUnmounted(() => {
  restaurantSub?.();
  queueSub?.();
});

const logout = async () => {
  queueSub?.();
  queueSub = null;
  await signOut(auth);
  router.push('/login');
};

const goToRestaurant = (id: string) => {
  router.push(`/restaurant/${id}`);
};

const viewQueue = () => {
  router.push('/my-queue');
};
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600&family=Joan&display=swap');

/* ================== Header & Toolbar ================== */
.custom-toolbar {
  --background: #8b3c3c;
  --color: white;
  padding: 5px 0;
}
.header-title {
  font-family: 'Joan', serif;
  font-size: 24px;
  letter-spacing: 1px;
  text-align: center;
}

/* ================== Background ================== */
.custom-background {
  --background: #f5f5f5;
}

/* ================== Queue Banner ================== */
.queue-banner {
  background: linear-gradient(135deg, #c5693b 0%, #8b3c3c 100%);
  margin: 20px;
  padding: 20px;
  border-radius: 15px;
  color: white;
  box-shadow: 0 8px 20px rgba(139, 60, 60, 0.3);
  display: flex;
  flex-direction: column;
  gap: 15px;
}
.queue-info h2 {
  margin: 0;
  font-size: 16px;
  font-weight: 400;
  font-family: 'Inter', sans-serif;
}
.queue-info h2 span {
  font-size: 28px;
  font-weight: bold;
}
.queue-info p {
  margin: 5px 0 0 0;
  font-size: 14px;
  opacity: 0.9;
}
.view-queue-btn {
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.5);
  color: white;
  padding: 12px;
  border-radius: 10px;
  font-weight: bold;
  font-size: 15px;
  cursor: pointer;
  backdrop-filter: blur(5px);
  transition: background 0.2s;
}
.view-queue-btn:active {
  background: rgba(255, 255, 255, 0.3);
}

/* ================== Section Header ================== */
.section-header {
  padding: 10px 20px 0 20px;
}
.section-header h2 {
  font-family: 'Times New Roman', Times, serif;
  font-size: 28px;
  color: #1a0f0f;
  margin: 0;
  font-weight: bold;
}
.section-header p {
  font-family: 'Inter', sans-serif;
  color: #888;
  font-size: 14px;
  margin: 5px 0 15px 0;
}

/* ================== Restaurant List (Cards) ================== */
.restaurant-list {
  padding: 0 20px 30px 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.restaurant-card {
  background: white;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.08);
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.restaurant-card:active {
  transform: scale(0.98);
}
.card-image {
  position: relative;
  width: 100%;
  height: 160px;
}
.card-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.status-badge {
  position: absolute;
  top: 15px;
  right: 15px;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: bold;
  color: white;
  font-family: 'Inter', sans-serif;
  box-shadow: 0 2px 10px rgba(0,0,0,0.2);
}
.status-open { background: #2ecc71; }
.status-closed { background: #95a5a6; }

.card-content {
  padding: 15px 20px;
}
.res-name {
  margin: 0;
  font-size: 18px;
  font-weight: bold;
  color: #333;
  font-family: 'Times New Roman', Times, serif;
}
.res-desc {
  margin: 8px 0 0 0;
  font-size: 14px;
  color: #777;
  font-family: 'Inter', sans-serif;
  display: -webkit-box;
  -webkit-line-clamp: 2; /* ตัดคำถ้ายาวเกิน 2 บรรทัด */
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* ================== States ================== */
.loading-container, .empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 30vh;
}
.custom-spinner {
  color: #8b3c3c;
  width: 40px;
  height: 40px;
}
.empty-state p {
  color: #888;
  font-family: 'Inter', sans-serif;
}
</style>