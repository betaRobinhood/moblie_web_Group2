<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/staff/dashboard"></ion-back-button>
        </ion-buttons>
        <ion-title>Manage Tables</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="openAddSheet">
            <ion-icon :icon="addOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <div v-if="tables.length === 0" class="empty-state ion-text-center">
        <ion-icon :icon="gridOutline" size="large" color="medium"></ion-icon>
        <p>No tables added yet.</p>
      </div>

      <!-- Visual Table Grid -->
      <div class="tables-grid" v-else>
        <div
          v-for="table in sortedTables"
          :key="table.id"
          class="table-card"
          :class="table.occupied ? 'occupied' : 'available'"
        >
          <div class="table-number">{{ table.number }}</div>
          <div class="table-capacity">{{ table.capacity }} seats</div>
          <ion-badge :color="table.occupied ? 'danger' : 'success'">
            {{ table.occupied ? 'Occupied' : 'Available' }}
          </ion-badge>
          <ion-button
            fill="clear"
            color="danger"
            size="small"
            class="delete-btn"
            @click="deleteTable(table.id)"
          >
            <ion-icon :icon="trashOutline" slot="icon-only"></ion-icon>
          </ion-button>
        </div>
      </div>
    </ion-content>

    <!-- Add Table Modal (Bottom Sheet) -->
    <ion-modal
      :is-open="showAddSheet"
      @didDismiss="showAddSheet = false"
      :initial-breakpoint="0.5"
      :breakpoints="[0, 0.5, 0.8]"
    >
      <ion-header>
        <ion-toolbar>
          <ion-title>Add New Table</ion-title>
          <ion-buttons slot="end">
            <ion-button @click="showAddSheet = false">Cancel</ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>
      <ion-content class="ion-padding">
        <div class="add-form">
          <ion-list>
            <ion-item>
              <ion-input
                label="Table Number"
                label-placement="stacked"
                type="number"
                v-model.number="newTable.number"
                placeholder="e.g. 1"
              ></ion-input>
            </ion-item>
            <ion-item>
              <ion-input
                label="Capacity (seats)"
                label-placement="stacked"
                type="number"
                v-model.number="newTable.capacity"
                placeholder="e.g. 4"
              ></ion-input>
            </ion-item>
          </ion-list>
          <ion-button expand="block" class="ion-margin-top" @click="addTable">
            Add Table
          </ion-button>
        </div>
      </ion-content>
    </ion-modal>

    <!-- Floating Add FAB -->
    <ion-fab vertical="bottom" horizontal="end" slot="fixed">
      <ion-fab-button @click="openAddSheet" color="primary">
        <ion-icon :icon="addOutline"></ion-icon>
      </ion-fab-button>
    </ion-fab>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonBackButton, IonButtons, IonButton, IonList, IonItem,
  IonBadge, IonIcon, IonInput, IonFab, IonFabButton, IonModal,
  alertController, toastController
} from '@ionic/vue';
import { trashOutline, addOutline, gridOutline } from 'ionicons/icons';
import { db } from '../../services/firebase';
import { collection, query, onSnapshot, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { useUserStore } from '../../stores/userStore';

const userStore = useUserStore();
const restaurantId = userStore.profile?.restaurantId || 'DEMO_REST_ID';

const tables = ref<any[]>([]);
const newTable = ref({ number: 1, capacity: 4 });
const showAddSheet = ref(false);
let tableSub: any;

const sortedTables = computed(() =>
  [...tables.value].sort((a, b) => a.number - b.number)
);

onMounted(() => {
  const q = query(collection(db, `restaurants/${restaurantId}/tables`));
  tableSub = onSnapshot(q, (snapshot) => {
    tables.value = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  });
});

onUnmounted(() => {
  if (tableSub) tableSub();
});

const openAddSheet = () => {
  showAddSheet.value = true;
};

const addTable = async () => {
  if (!newTable.value.number || !newTable.value.capacity) {
    const toast = await toastController.create({
      message: 'Please enter table number and capacity.',
      duration: 2000, color: 'warning', position: 'top'
    });
    await toast.present();
    return;
  }
  await addDoc(collection(db, `restaurants/${restaurantId}/tables`), {
    number: newTable.value.number,
    capacity: newTable.value.capacity,
    occupied: false,
    currentQueueId: null
  });
  newTable.value = { number: newTable.value.number + 1, capacity: 4 };
  showAddSheet.value = false;

  const toast = await toastController.create({
    message: 'Table added successfully.',
    duration: 2000, color: 'success', position: 'bottom'
  });
  await toast.present();
};

const deleteTable = async (id: string) => {
  const alert = await alertController.create({
    header: 'Delete Table',
    message: 'Are you sure you want to delete this table?',
    buttons: [
      { text: 'Cancel', role: 'cancel' },
      {
        text: 'Delete',
        role: 'destructive',
        handler: async () => {
          await deleteDoc(doc(db, `restaurants/${restaurantId}/tables`, id));
        }
      }
    ]
  });
  await alert.present();
};
</script>

<style scoped>
.tables-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
  gap: 16px;
  padding-bottom: 80px;
}

.table-card {
  border-radius: 12px;
  padding: 16px 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  position: relative;
}

.table-card.available {
  background: #f0fdf4;
  border: 2px solid #22c55e;
}

.table-card.occupied {
  background: #fff1f2;
  border: 2px solid #ef4444;
}

.table-number {
  font-size: 32px;
  font-weight: bold;
  color: #1a1a1a;
}

.table-capacity {
  font-size: 13px;
  color: #666;
}

.delete-btn {
  position: absolute;
  top: 4px;
  right: 4px;
  --padding-start: 4px;
  --padding-end: 4px;
}

.empty-state {
  padding-top: 80px;
}

.empty-state p {
  color: #888;
  margin-top: 12px;
}
</style>
