<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/home"></ion-back-button>
        </ion-buttons>
        <ion-title>Staff Dashboard</ion-title>
        <ion-buttons slot="end">
          <ion-button router-link="/staff/management" fill="clear">
            <ion-icon :icon="settingsOutline"></ion-icon>
          </ion-button>
          <ion-button @click="openScanner">
            <ion-icon :icon="qrCodeOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <ion-list-header>
        <ion-label>Waiting Customers ({{ waitingQueue.length }})</ion-label>
      </ion-list-header>

      <div v-if="waitingQueue.length === 0" class="ion-padding ion-text-center">
        <ion-icon :icon="peopleOutline" size="large" color="medium"></ion-icon>
        <p>No customers in queue</p>
      </div>

      <ion-list>
        <ion-item-sliding v-for="q in waitingQueue" :key="q.id">
          <ion-item>
            <ion-label>
              <h2>Position {{ q.position }} — Party of {{ q.partySize }}</h2>
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

      <ion-fab vertical="bottom" horizontal="end" slot="fixed">
        <ion-fab-button @click="openScanner" color="primary">
          <ion-icon :icon="qrCodeOutline"></ion-icon>
        </ion-fab-button>
      </ion-fab>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonList, IonItem, IonLabel, IonBadge, IonListHeader,
  IonItemSliding, IonItemOptions, IonItemOption,
  IonFab, IonFabButton, IonIcon, IonButtons, IonButton,
  IonBackButton
} from '@ionic/vue';
import { qrCodeOutline, settingsOutline, callOutline, playSkipForwardOutline, peopleOutline } from 'ionicons/icons';
import { db } from '../../services/firebase';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { useRouter } from 'vue-router';
import type { QueueEntry } from '../../models/types';
import { useUserStore } from '../../stores/userStore';

const router = useRouter();
const userStore = useUserStore();
const waitingQueue = ref<QueueEntry[]>([]);
let queueSub: (() => void) | null = null;

onMounted(() => {
  // Get restaurantId from user profile; fallback to a demo ID
  const restaurantId = userStore.profile?.restaurantId || 'DEMO_REST_ID';
  const q = query(
    collection(db, 'queues'),
    where('restaurantId', '==', restaurantId),
    where('status', 'in', ['waiting', 'called']),
    orderBy('createdAt', 'asc')
  );
  queueSub = onSnapshot(q, (snapshot) => {
    waitingQueue.value = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as QueueEntry));
  });
});

onUnmounted(() => {
  queueSub?.();
});

const callCustomer = async (id: string) => {
  await updateDoc(doc(db, 'queues', id), { status: 'called', calledAt: new Date() });
};

const skipCustomer = async (id: string) => {
  await updateDoc(doc(db, 'queues', id), { status: 'skipped' });
};

const openScanner = () => {
  router.push('/staff/scanner');
};
</script>
