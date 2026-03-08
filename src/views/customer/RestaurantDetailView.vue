<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar class="custom-toolbar">
        <ion-buttons slot="start">
          <ion-button @click="goHome" color="light">
            <ion-icon :icon="arrowBackOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
        <ion-title class="header-title">{{ restaurant?.name[locale?.value || 'en'] || 'Restaurant' }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true" class="custom-background">
      <div v-if="loading" class="loading-container">
        <ion-spinner name="crescent" class="custom-spinner"></ion-spinner>
      </div>

      <template v-else-if="restaurant">
        <div class="header-image">
          <img :src="restaurant.coverImageUrl || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80'" />
          <div class="image-overlay"></div>
        </div>

        <div class="detail-card">
          <h1 class="restaurant-name">{{ restaurant.name[locale?.value || 'en'] || restaurant.name['en'] }}</h1>
          <p class="restaurant-desc">{{ restaurant.description[locale?.value || 'en'] || restaurant.description['en'] }}</p>

          <div class="info-section">
            <div class="info-row">
              <div class="icon-box"><ion-icon :icon="locationOutline"></ion-icon></div>
              <div class="info-text">
                <h3>Location</h3>
                <p>{{ restaurant.location || 'Bangkok, Thailand' }}</p>
              </div>
            </div>
            
            <div class="info-row">
              <div class="icon-box"><ion-icon :icon="timeOutline"></ion-icon></div>
              <div class="info-text">
                <h3>Opening Hours</h3>
                <p>{{ restaurant.openingHours || '10:00 AM - 10:00 PM' }}</p>
              </div>
            </div>

            <div class="info-row">
              <div class="icon-box"><ion-icon :icon="peopleOutline"></ion-icon></div>
              <div class="info-text">
                <h3>Avg. Dining Time</h3>
                <p>{{ restaurant.avgDiningTime || '60' }} mins</p>
              </div>
            </div>
          </div>

          <div v-if="alreadyInQueue" class="warning-card">
            <p>คุณอยู่ในคิวของร้านนี้แล้ว</p>
            <div style="display: flex; justify-content: space-around; margin-top: 10px;">
              <a @click="router.push('/my-queue')" class="link-btn">ดูสถานะคิว</a>
              <a v-if="queueStore.activeQueue?.status === 'seated'" @click="router.push(`/restaurant/${restaurant.id}/menu`)" class="link-btn">ดูเมนูอาหาร</a>
            </div>
          </div>

          <div v-else class="action-section">
            <h3 class="input-label">Party Size (จำนวนคน)</h3>
            <div class="input-wrapper">
              <ion-input 
                class="custom-input" 
                type="number" 
                :value="partySize" 
                @ionInput="partySize = Number(($event.target as any).value)" 
                min="1" 
                max="20">
              </ion-input>
              <ion-icon :icon="peopleOutline" class="input-icon"></ion-icon>
            </div>

            <button class="submit-btn" @click="handleJoinQueue" :disabled="queueStore.loading">
              <ion-spinner v-if="queueStore.loading" name="crescent"></ion-spinner>
              <span v-else>จองคิว (Join Queue)</span>
            </button>
          </div>
        </div>
      </template>

      <div v-else class="not-found-container">
        <h2>Restaurant not found.</h2>
        <button class="submit-btn outline-btn" @click="goHome">Go Home</button>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonButton, IonButtons, IonIcon, IonInput, IonSpinner
} from '@ionic/vue';
// นำเข้าไอคอนลูกศรกลับ (arrowBackOutline)
import { locationOutline, timeOutline, peopleOutline, arrowBackOutline } from 'ionicons/icons';
import { db } from '../../services/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useRestaurantStore } from '../../stores/restaurantStore';
import { useQueueStore } from '../../stores/queueStore';
import { useUserStore } from '../../stores/userStore';
import { useI18n } from 'vue-i18n';
import type { Restaurant } from '../../models/types';

const route = useRoute();
const router = useRouter();
const restaurantStore = useRestaurantStore();
const queueStore = useQueueStore();
const userStore = useUserStore();

const i18n = useI18n();
const locale = i18n?.locale as { value: 'en' | 'th' } | undefined;

const restaurant = ref<Restaurant | null>(null);
const partySize = ref(2);
const loading = ref(true);

const alreadyInQueue = computed(() =>
  queueStore.activeQueue?.restaurantId === restaurant.value?.id
);

onMounted(async () => {
  const id = route.params.id as string;
  const fromStore = restaurantStore.restaurants.find((r: any) => r.id === id);
  if (fromStore) {
    restaurant.value = fromStore;
    loading.value = false;
    return;
  }
  try {
    const snap = await getDoc(doc(db, 'restaurants', id));
    if (snap.exists()) {
      restaurant.value = { id: snap.id, ...snap.data() } as Restaurant;
    }
  } finally {
    loading.value = false;
  }
});

// ฟังก์ชันกลับหน้าแรก
const goHome = () => {
  router.replace('/home');
};

const handleJoinQueue = async () => {
  if (!restaurant.value || !userStore.user) return;
  
  await queueStore.joinQueue(
    restaurant.value.id,
    userStore.user.uid,
    partySize.value
  );
  
  router.push('/my-queue');
};
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600&family=Joan&display=swap');

.custom-toolbar { --background: #8b3c3c; --color: white; }
.header-title { font-family: 'Joan', serif; font-size: 20px; letter-spacing: 1px; }
.custom-background { --background: #f5f5f5; }

.header-image { position: relative; width: 100%; height: 280px; }
.header-image img { width: 100%; height: 100%; object-fit: cover; }
.image-overlay { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.6) 100%); }

.detail-card { position: relative; z-index: 10; background: #ffffff; margin-top: -40px; border-top-left-radius: 30px; border-top-right-radius: 30px; padding: 30px 20px 40px 20px; min-height: 60vh; box-shadow: 0px -5px 15px rgba(0, 0, 0, 0.1); }
.restaurant-name { font-family: 'Times New Roman', Times, serif; font-size: 32px; color: #1a0f0f; margin: 0 0 10px 0; font-weight: bold; }
.restaurant-desc { font-family: 'Inter', sans-serif; color: #666; font-size: 15px; line-height: 1.5; margin-bottom: 25px; }

.info-section { display: flex; flex-direction: column; gap: 15px; margin-bottom: 30px; padding-bottom: 25px; border-bottom: 1px solid #eee; }
.info-row { display: flex; align-items: center; gap: 15px; }
.icon-box { width: 45px; height: 45px; background: #fcf4f4; border-radius: 12px; display: flex; justify-content: center; align-items: center; color: #8b3c3c; font-size: 22px; }
.info-text h3 { margin: 0; font-size: 13px; color: #999; font-weight: 600; text-transform: uppercase; }
.info-text p { margin: 4px 0 0 0; font-size: 15px; color: #333; font-weight: 500; }

.action-section { display: flex; flex-direction: column; align-items: center; }
.input-label { align-self: flex-start; font-size: 14px; color: #555; margin-bottom: 8px; font-weight: 600; }
.input-wrapper { position: relative; width: 100%; margin-bottom: 20px; }
.custom-input { --background: #f9f9f9; --padding-start: 45px; --padding-end: 15px; --padding-top: 14px; --padding-bottom: 14px; width: 100%; border: 1.5px solid #e0e0e0; border-radius: 12px; font-size: 16px; font-weight: 600; color: #333; }
.custom-input::part(native) { padding: 0; }
.input-icon { position: absolute; left: 15px; top: 50%; transform: translateY(-50%); font-size: 20px; color: #8b3c3c; z-index: 2; }

.submit-btn { background: #8b3c3c; color: white; font-size: 18px; font-weight: bold; letter-spacing: 1px; padding: 16px 40px; border: none; border-radius: 30px; box-shadow: 0px 5px 15px rgba(139, 60, 60, 0.3); cursor: pointer; width: 100%; display: flex; justify-content: center; align-items: center; transition: all 0.2s; }
.submit-btn:active { transform: scale(0.97); }

.warning-card { background: #fff8eb; border-left: 5px solid #f5b041; padding: 20px; border-radius: 10px; text-align: center; }
.warning-card p { margin: 0 0 10px 0; color: #7a571f; font-weight: 600; }
.link-btn { color: #d68910; font-weight: bold; cursor: pointer; text-decoration: underline; }

.loading-container, .not-found-container { display: flex; flex-direction: column; justify-content: center; align-items: center; height: 100%; }
.custom-spinner { color: #8b3c3c; width: 40px; height: 40px; }
.outline-btn { background: transparent; border: 2px solid #8b3c3c; color: #8b3c3c; box-shadow: none; margin-top: 20px; width: auto; }
</style>