<template>
  <ion-header>
    <ion-toolbar>
      <ion-title>Assign to Table {{ tableNumber }}</ion-title>
      <ion-buttons slot="end">
        <ion-button @click="dismiss()">
          <ion-icon :icon="closeOutline"></ion-icon>
        </ion-button>
      </ion-buttons>
    </ion-toolbar>
  </ion-header>
  <ion-content class="ion-padding">
    <div v-if="calledQueue.length === 0" class="ion-text-center ion-padding">
      <ion-icon :icon="peopleOutline" size="large" color="medium"></ion-icon>
      <p>No customers have been called yet.<br>Call a customer from the Queue tab first.</p>
    </div>

    <ion-list v-else>
      <ion-list-header>
        <ion-label>Select a Customer to Seat</ion-label>
      </ion-list-header>
      <ion-item
        v-for="q in calledQueue"
        :key="q.id"
        button
        @click="assignToTable(q)"
      >
        <ion-icon :icon="personOutline" slot="start" color="warning"></ion-icon>
        <ion-label>
          <h2>Party of {{ q.partySize }}</h2>
          <p>Status: <strong>{{ q.status }}</strong> · Queue #{{ q.position }}</p>
        </ion-label>
        <ion-badge slot="end" color="warning">Called</ion-badge>
      </ion-item>
    </ion-list>
  </ion-content>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton,
  IonList, IonListHeader, IonItem, IonLabel, IonIcon, IonBadge,
  modalController, toastController
} from '@ionic/vue';
import { closeOutline, peopleOutline, personOutline } from 'ionicons/icons';
import { db } from '../services/firebase';
import {
  collection, query, where, getDocs, doc, writeBatch
} from 'firebase/firestore';
import type { QueueEntry } from '../models/types';

const props = defineProps<{
  restaurantId: string;
  tableId: string;
  tableNumber: number;
}>();

const calledQueue = ref<QueueEntry[]>([]);

onMounted(async () => {
  const q = query(
    collection(db, 'queues'),
    where('restaurantId', '==', props.restaurantId),
    where('status', '==', 'called')
  );
  const snap = await getDocs(q);
  calledQueue.value = snap.docs.map(d => ({ id: d.id, ...d.data() } as QueueEntry));
});

const assignToTable = async (queue: QueueEntry) => {
  try {
    const batch = writeBatch(db);

    // Update queue entry: seated + tableId
    batch.update(doc(db, 'queues', queue.id), {
      status: 'seated',
      tableId: props.tableId,
      tableNumber: props.tableNumber,
      seatedAt: new Date()
    });

    // Update table: occupied
    batch.update(doc(db, `restaurants/${props.restaurantId}/tables`, props.tableId), {
      occupied: true,
      currentQueueId: queue.id
    });

    await batch.commit();

    const toast = await toastController.create({
      message: `Party of ${queue.partySize} seated at Table ${props.tableNumber}`,
      duration: 2000,
      color: 'success',
      position: 'top'
    });
    await toast.present();
    dismiss();
  } catch (e) {
    console.error('Assign error', e);
    const toast = await toastController.create({
      message: 'Failed to assign table. Try again.',
      duration: 2000,
      color: 'danger',
      position: 'top'
    });
    await toast.present();
  }
};

const dismiss = () => modalController.dismiss();
</script>
