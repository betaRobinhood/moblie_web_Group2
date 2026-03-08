<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/staff/management"></ion-back-button>
        </ion-buttons>
        <ion-title>Manage Tables</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <ion-list>
        <ion-item v-for="table in tables" :key="table.id">
          <ion-label>
            <h2>Table {{ table.number }}</h2>
            <p>Capacity: {{ table.capacity }} people</p>
          </ion-label>
          <ion-badge slot="end" :color="table.occupied ? 'danger' : 'success'">
            {{ table.occupied ? 'Occupied' : 'Available' }}
          </ion-badge>
          <ion-button slot="end" fill="clear" color="danger" @click="deleteTable(table.id)">
            <ion-icon :icon="trashOutline"></ion-icon>
          </ion-button>
        </ion-item>
      </ion-list>

      <div class="ion-padding">
        <ion-item>
          <ion-label position="stacked">New Table Number</ion-label>
          <ion-input v-model.number="newTable.number" type="number"></ion-input>
        </ion-item>
        <ion-item>
          <ion-label position="stacked">Capacity</ion-label>
          <ion-input v-model.number="newTable.capacity" type="number"></ion-input>
        </ion-item>
        <ion-button expand="block" class="ion-margin-top" @click="addTable">
          Add Table
        </ion-button>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { 
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, 
  IonBackButton, IonButtons, IonList, IonItem, IonLabel,
  IonBadge, IonButton, IonIcon, IonInput 
} from '@ionic/vue';
import { trashOutline } from 'ionicons/icons';
import { db } from '../../services/firebase';
import { collection, query, onSnapshot, addDoc, deleteDoc, doc } from 'firebase/firestore';

const restaurantId = 'DEMO_REST_ID';
const tables = ref<any[]>([]);
const newTable = ref({ number: 1, capacity: 4 });
let tableSub: any;

onMounted(() => {
  const q = query(collection(db, `restaurants/${restaurantId}/tables`));
  tableSub = onSnapshot(q, (snapshot) => {
    tables.value = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  });
});

onUnmounted(() => {
  if (tableSub) tableSub();
});

const addTable = async () => {
  await addDoc(collection(db, `restaurants/${restaurantId}/tables`), {
    ...newTable.value,
    occupied: false
  });
  newTable.value.number++;
};

const deleteTable = async (id: string) => {
  if (confirm('Delete this table?')) {
    await deleteDoc(doc(db, `restaurants/${restaurantId}/tables`, id));
  }
};
</script>
