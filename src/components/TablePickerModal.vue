<template>
  <ion-header>
    <ion-toolbar>
      <ion-title>Assign Table</ion-title>
      <ion-buttons slot="end">
        <ion-button @click="dismiss()">
          <ion-icon :icon="closeOutline"></ion-icon>
        </ion-button>
      </ion-buttons>
    </ion-toolbar>
  </ion-header>
  <ion-content class="ion-padding">
    <div v-if="loading" class="ion-text-center ion-padding">
      <ion-spinner name="crescent"></ion-spinner>
    </div>

    <div v-else-if="availableTables.length === 0" class="ion-text-center ion-padding">
      <ion-icon :icon="gridOutline" size="large" color="medium"></ion-icon>
      <p>No available tables.<br>Please free up a table first.</p>
    </div>

    <div v-else class="tables-grid">
      <div
        v-for="table in availableTables"
        :key="table.id"
        class="table-item"
        @click="assignTable(table)"
      >
        <div class="table-number">{{ table.number }}</div>
        <div class="table-capacity">{{ table.capacity }} seats</div>
      </div>
    </div>
  </ion-content>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton,
  IonSpinner, IonIcon, modalController, toastController
} from '@ionic/vue';
import { closeOutline, gridOutline } from 'ionicons/icons';
import { db } from '../services/firebase';
import {
  collection, query, where, getDocs, doc, writeBatch
} from 'firebase/firestore';

const props = defineProps<{
  restaurantId: string;
  queueId: string;
}>();

const availableTables = ref<any[]>([]);
const loading = ref(true);

onMounted(async () => {
  try {
    const tq = query(
      collection(db, `restaurants/${props.restaurantId}/tables`),
      where('occupied', '==', false)
    );
    const snap = await getDocs(tq);
    availableTables.value = snap.docs.map(d => ({
      id: d.id,
      ...(d.data() as any)
    })).sort((a, b) => (a.number || 0) - (b.number || 0));
  } catch (e) {
    console.error('Fetch tables error', e);
  } finally {
    loading.value = false;
  }
});

const assignTable = async (table: any) => {
  try {
    const batch = writeBatch(db);

    // Update queue entry
    batch.update(doc(db, 'queues', props.queueId), {
      status: 'seated',
      tableId: table.id,
      tableNumber: table.number,
      seatedAt: new Date()
    });

    // Update table status
    batch.update(doc(db, `restaurants/${props.restaurantId}/tables`, table.id), {
      occupied: true,
      currentQueueId: props.queueId
    });

    await batch.commit();

    const toast = await toastController.create({
      message: `Customer assigned to Table ${table.number}`,
      duration: 2000,
      color: 'success',
      position: 'top'
    });
    await toast.present();
    
    modalController.dismiss({ success: true });
  } catch (e) {
    console.error('Assign table error', e);
    const toast = await toastController.create({
      message: 'Failed to assign table.',
      duration: 2000,
      color: 'danger'
    });
    await toast.present();
  }
};

const dismiss = () => modalController.dismiss();
</script>

<style scoped>
.tables-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 12px;
}
.table-item {
  background: #f0fdf4;
  border: 2px solid #22c55e;
  border-radius: 10px;
  padding: 15px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  cursor: pointer;
}
.table-item:active {
  transform: scale(0.95);
}
.table-number {
  font-size: 24px;
  font-weight: bold;
  color: #166534;
}
.table-capacity {
  font-size: 12px;
  color: #15803d;
}
</style>
