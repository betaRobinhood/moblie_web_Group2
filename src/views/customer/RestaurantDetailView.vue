<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/home"></ion-back-button>
        </ion-buttons>
        <ion-title>{{ restaurant?.name[locale.value] || 'Restaurant' }}</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <!-- Loading -->
      <div v-if="loading" class="ion-padding ion-text-center">
        <ion-spinner name="crescent"></ion-spinner>
      </div>

      <template v-else-if="restaurant">
        <div class="header-image">
          <img :src="restaurant.coverImageUrl || 'https://placehold.co/600x300/f4f5f8/999?text=Restaurant'" />
        </div>

        <div class="ion-padding">
          <h1>{{ restaurant.name[locale.value] || restaurant.name['en'] }}</h1>
          <p>{{ restaurant.description[locale.value] || restaurant.description['en'] }}</p>

          <ion-list>
            <ion-item>
              <ion-icon :icon="locationOutline" slot="start"></ion-icon>
              <ion-label>
                <h3>Location</h3>
                <p>{{ restaurant.location }}</p>
              </ion-label>
            </ion-item>
            <ion-item>
              <ion-icon :icon="timeOutline" slot="start"></ion-icon>
              <ion-label>
                <h3>Opening Hours</h3>
                <p>{{ restaurant.openingHours }}</p>
              </ion-label>
            </ion-item>
            <ion-item>
              <ion-icon :icon="peopleOutline" slot="start"></ion-icon>
              <ion-label>
                <h3>Avg. Dining Time</h3>
                <p>{{ restaurant.avgDiningTime }} mins</p>
              </ion-label>
            </ion-item>
          </ion-list>

          <!-- Check if user already in queue -->
          <ion-card v-if="alreadyInQueue" color="warning" class="ion-margin-top">
            <ion-card-content>
              You are already in a queue. <a @click="router.push('/my-queue')">View your queue →</a>
            </ion-card-content>
          </ion-card>

          <template v-else>
            <ion-item class="ion-margin-top">
              <ion-label position="stacked">Party Size</ion-label>
              <ion-input type="number" :value="partySize" @ionInput="partySize = Number(($event.target as any).value)" min="1" max="20"></ion-input>
            </ion-item>

            <ion-button expand="block" class="ion-margin-top" @click="handleJoinQueue" :disabled="joining">
              <ion-spinner v-if="joining" name="crescent"></ion-spinner>
              <span v-else>{{ $t('queue.join') }}</span>
            </ion-button>
          </template>
        </div>
      </template>

      <div v-else class="ion-padding ion-text-center">
        <p>Restaurant not found.</p>
        <ion-button router-link="/home">Go Home</ion-button>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonBackButton, IonButtons, IonIcon, IonItem, IonLabel,
  IonButton, IonInput, IonSpinner, IonList, IonCard, IonCardContent
} from '@ionic/vue';
import { locationOutline, timeOutline, peopleOutline } from 'ionicons/icons';
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
const { locale } = useI18n() as { locale: { value: 'en' | 'th' } };

const restaurant = ref<Restaurant | null>(null);
const partySize = ref(2);
const joining = ref(false);
const loading = ref(true);

const alreadyInQueue = computed(() =>
  queueStore.activeQueue?.restaurantId === restaurant.value?.id
);

onMounted(async () => {
  const id = route.params.id as string;
  // First try from already-loaded store
  const fromStore = restaurantStore.restaurants.find(r => r.id === id);
  if (fromStore) {
    restaurant.value = fromStore;
    loading.value = false;
    return;
  }
  // Fallback: fetch directly from Firestore
  try {
    const snap = await getDoc(doc(db, 'restaurants', id));
    if (snap.exists()) {
      restaurant.value = { id: snap.id, ...snap.data() } as Restaurant;
    }
  } finally {
    loading.value = false;
  }
});

const handleJoinQueue = async () => {
  if (!restaurant.value || !userStore.user) return;
  joining.value = true;
  try {
    await queueStore.joinQueue(restaurant.value.id, userStore.user.uid, partySize.value);
    router.push('/my-queue');
  } catch (e) {
    console.error('Failed to join queue', e);
  } finally {
    joining.value = false;
  }
};
</script>

<style scoped>
.header-image img {
  width: 100%;
  height: 220px;
  object-fit: cover;
}
</style>
