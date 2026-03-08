<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button router-link="/profile">
            <ion-icon :icon="personCircleOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
        <ion-title>EzyDine</ion-title>
        <ion-buttons slot="end">
          <ion-button v-if="userStore.profile?.role !== 'customer'" router-link="/staff/dashboard" fill="clear">
            <ion-icon :icon="briefcaseOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <!-- Active Queue Banner -->
      <ion-card v-if="queueStore.activeQueue" color="primary" class="ion-margin">
        <ion-card-header>
          <ion-card-title>{{ $t('queue.current_position') }}: #{{ queueStore.activeQueue.position }}</ion-card-title>
          <ion-card-subtitle>
            {{ $t('queue.est_wait') }}: ~{{ queueStore.activeQueue.estimatedWaitTime }} {{ $t('queue.mins') }}
          </ion-card-subtitle>
        </ion-card-header>
        <ion-card-content>
          <ion-button expand="block" color="light" @click="viewQueue">
            View QR Code
          </ion-button>
        </ion-card-content>
      </ion-card>

      <!-- Restaurant List -->
      <ion-list-header class="ion-margin-top">
        <ion-label>Restaurants</ion-label>
      </ion-list-header>

      <div v-if="restaurantStore.loading" class="ion-padding ion-text-center">
        <ion-spinner name="crescent"></ion-spinner>
      </div>

      <div v-else-if="restaurantStore.restaurants.length === 0" class="ion-padding ion-text-center">
        <p>No restaurants available.</p>
      </div>

      <ion-list v-else>
        <ion-item
          v-for="res in restaurantStore.restaurants"
          :key="res.id"
          button
          @click="goToRestaurant(res.id)"
        >
          <ion-thumbnail slot="start">
            <img :src="res.coverImageUrl || 'https://placehold.co/80x80/f4f5f8/999?text=No+Img'" />
          </ion-thumbnail>
          <ion-label>
            <h2>{{ res.name[locale.value] || res.name['en'] }}</h2>
            <p>{{ res.description[locale.value] || res.description['en'] }}</p>
          </ion-label>
          <ion-badge slot="end" :color="res.queueEnabled ? 'success' : 'medium'">
            {{ res.queueEnabled ? 'Open' : 'Closed' }}
          </ion-badge>
        </ion-item>
      </ion-list>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, watch } from 'vue';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonList, IonItem, IonLabel, IonThumbnail, IonBadge,
  IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent,
  IonButton, IonButtons, IonIcon, IonListHeader, IonSpinner
} from '@ionic/vue';
import { briefcaseOutline, personCircleOutline } from 'ionicons/icons';
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
const { locale } = useI18n() as { locale: { value: 'en' | 'th' } };

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
