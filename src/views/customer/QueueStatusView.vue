<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/home"></ion-back-button>
        </ion-buttons>
        <ion-title>{{ $t('queue.status.waiting') }}</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding ion-text-center">

      <!-- Loading -->
      <div v-if="queueStore.loading" class="ion-padding">
        <ion-spinner name="crescent"></ion-spinner>
      </div>

      <!-- Active Queue -->
      <div v-else-if="queueStore.activeQueue" class="status-container">
        <ion-card class="ion-margin-bottom">
          <ion-card-content>
            <p class="status-label">{{ $t('queue.current_position') }}</p>
            <h1 class="position">{{ queueStore.activeQueue.position }}</h1>
            <p>{{ $t('queue.est_wait') }}: ~{{ queueStore.activeQueue.estimatedWaitTime }} {{ $t('queue.mins') }}</p>
            <ion-badge :color="statusColor">{{ $t(`queue.status.${queueStore.activeQueue.status}`) }}</ion-badge>
          </ion-card-content>
        </ion-card>

        <div class="qr-container ion-margin-vertical">
          <qrcode-vue :value="qrValue" :size="220" level="H" />
          <p class="ion-margin-top">แสดง QR code นี้แก่พนักงานเมื่อถึงร้าน</p>
          <p>Show this QR code to staff upon arrival</p>
        </div>

        <ion-button
          v-if="queueStore.activeQueue.status === 'seated'"
          expand="block"
          color="success"
          @click="goToMenu"
          class="ion-margin-top"
        >
          Order Food
        </ion-button>

        <ion-button
          expand="block"
          fill="outline"
          color="danger"
          class="ion-margin-top"
          @click="cancelQueue"
          :disabled="cancelling"
        >
          <ion-spinner v-if="cancelling" name="crescent"></ion-spinner>
          <span v-else>Cancel Queue</span>
        </ion-button>
      </div>

      <!-- No Active Queue -->
      <div v-else class="empty-state">
        <ion-icon :icon="ticketOutline" size="large" color="medium"></ion-icon>
        <h3>No Active Queue</h3>
        <p>You haven't joined any restaurant queue yet.</p>
        <ion-button expand="block" router-link="/home">Find Restaurants</ion-button>
      </div>

    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonBackButton, IonButtons, IonCard, IonCardContent,
  IonButton, IonSpinner, IonIcon, IonBadge
} from '@ionic/vue';
import { ticketOutline } from 'ionicons/icons';
import QrcodeVue from 'qrcode.vue';
import { useQueueStore } from '../../stores/queueStore';
import { useUserStore } from '../../stores/userStore';
import { db } from '../../services/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { useRouter } from 'vue-router';

const queueStore = useQueueStore();
const userStore = useUserStore();
const router = useRouter();
const cancelling = ref(false);
let queueSub: (() => void) | null = null;

onMounted(() => {
  if (userStore.user) {
    queueSub = queueStore.subscribeToUserQueue(userStore.user.uid);
  }
});

onUnmounted(() => {
  queueSub?.();
});

const qrValue = computed(() => {
  if (!queueStore.activeQueue) return '';
  return JSON.stringify({
    uid: userStore.user?.uid,
    qid: queueStore.activeQueue.id,
    rid: queueStore.activeQueue.restaurantId
  });
});

const statusColor = computed(() => {
  const s = queueStore.activeQueue?.status;
  if (s === 'called') return 'warning';
  if (s === 'seated') return 'success';
  return 'primary';
});

const cancelQueue = async () => {
  if (!queueStore.activeQueue) return;
  cancelling.value = true;
  try {
    await updateDoc(doc(db, 'queues', queueStore.activeQueue.id), { status: 'skipped' });
  } finally {
    cancelling.value = false;
  }
};

const goToMenu = () => {
  if (queueStore.activeQueue) {
    router.push(`/restaurant/${queueStore.activeQueue.restaurantId}/menu`);
  }
};
</script>

<style scoped>
.status-container {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.position {
  font-size: 5rem;
  font-weight: bold;
  color: var(--ion-color-primary);
  margin: 0.5rem 0;
}
.status-label {
  font-size: 1rem;
  color: var(--ion-color-medium);
  margin-bottom: 0;
}
.qr-container {
  background: white;
  padding: 1rem;
  border-radius: 1rem;
  display: inline-block;
}
.empty-state {
  margin-top: 5rem;
}
</style>
