<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar class="custom-toolbar">
        <ion-buttons slot="start">
          <ion-back-button default-href="/staff/dashboard" color="light"></ion-back-button>
        </ion-buttons>
        <ion-title class="header-title">จัดการโต๊ะอาหาร</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="openAddSheet" color="light">
            <ion-icon :icon="addOutline" class="header-icon"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="custom-bg">
      <div class="content-wrapper">
        
        <div v-if="tables.length === 0" class="empty-state">
          <ion-icon :icon="gridOutline" class="empty-icon"></ion-icon>
          <h3>ยังไม่มีข้อมูลโต๊ะ</h3>
          <p>กดปุ่ม + ด้านล่างเพื่อเพิ่มโต๊ะสำหรับร้านของคุณ</p>
        </div>

        <div class="tables-grid" v-else>
          <div
            v-for="table in sortedTables"
            :key="table.id"
            class="table-card"
            :class="table.occupied ? 'occupied' : 'available'"
          >
            <button class="delete-btn" @click.stop="deleteTable(table.id)">
              <ion-icon :icon="trashOutline"></ion-icon>
            </button>

            <div class="table-header">
              <ion-icon :icon="table.occupied ? 'person' : 'personOutline'" class="table-icon"></ion-icon>
              <div class="table-status-badge">{{ table.occupied ? 'Occupied' : 'Available' }}</div>
            </div>
            
            <div class="table-number">{{ table.number }}</div>
            <div class="table-capacity">{{ table.capacity }} ที่นั่ง</div>
          </div>
        </div>
      </div>

      <ion-fab vertical="bottom" horizontal="end" slot="fixed">
        <ion-fab-button @click="openAddSheet" class="custom-fab-add">
          <ion-icon :icon="addOutline"></ion-icon>
        </ion-fab-button>
      </ion-fab>
    </ion-content>

    <ion-modal
      :is-open="showAddSheet"
      @didDismiss="showAddSheet = false"
      :initial-breakpoint="0.6"
      :breakpoints="[0, 0.6, 0.8]"
      class="custom-bottom-sheet"
    >
      <div class="sheet-content">
        <div class="sheet-header">
          <h2 class="sheet-title">เพิ่มโต๊ะใหม่</h2>
          <ion-icon :icon="closeOutline" class="close-icon" @click="showAddSheet = false"></ion-icon>
        </div>

        <div class="add-form">
          <div class="input-group">
            <label class="input-label">หมายเลขโต๊ะ (Table Number)</label>
            <input type="number" v-model.number="newTable.number" class="custom-input" placeholder="เช่น 1, 2, 3..." />
          </div>

          <div class="input-group">
            <label class="input-label">จำนวนที่นั่ง (Capacity)</label>
            <input type="number" v-model.number="newTable.capacity" class="custom-input" placeholder="จำนวนที่นั่งรองรับได้" />
          </div>

          <button class="action-btn" @click="addTable">
            <ion-icon :icon="addCircleOutline"></ion-icon>
            เพิ่มโต๊ะ
          </button>
        </div>
      </div>
    </ion-modal>

  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonBackButton, IonButtons, IonButton,
  IonIcon, IonFab, IonFabButton, IonModal,
  alertController, toastController
} from '@ionic/vue';
import { trashOutline, addOutline, gridOutline, closeOutline, addCircleOutline } from 'ionicons/icons';
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
      message: 'กรุณาระบุหมายเลขโต๊ะและจำนวนที่นั่ง',
      duration: 2000, color: 'warning', position: 'top'
    });
    await toast.present();
    return;
  }
  
  // ตรวจสอบว่ามีเบอร์โต๊ะนี้ซ้ำไหม
  const isDuplicate = tables.value.some(t => t.number === newTable.value.number);
  if (isDuplicate) {
     const toast = await toastController.create({
      message: 'หมายเลขโต๊ะนี้มีอยู่แล้ว กรุณาใช้หมายเลขอื่น',
      duration: 2500, color: 'danger', position: 'top'
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
  
  // รีเซ็ตค่าเพื่อเตรียมเพิ่มโต๊ะถัดไป
  newTable.value = { number: newTable.value.number + 1, capacity: 4 };
  showAddSheet.value = false;

  const toast = await toastController.create({
    message: 'เพิ่มโต๊ะเรียบร้อยแล้ว',
    duration: 2000, color: 'success', position: 'bottom'
  });
  await toast.present();
};

const deleteTable = async (id: string) => {
  const alert = await alertController.create({
    header: 'ลบโต๊ะ',
    message: 'คุณแน่ใจหรือไม่ว่าต้องการลบโต๊ะนี้?',
    buttons: [
      { text: 'ยกเลิก', role: 'cancel' },
      {
        text: 'ลบทิ้ง',
        role: 'destructive',
        handler: async () => {
          await deleteDoc(doc(db, `restaurants/${restaurantId}/tables`, id));
          const toast = await toastController.create({
            message: 'ลบโต๊ะเรียบร้อยแล้ว',
            duration: 1500, color: 'success', position: 'bottom'
          });
          await toast.present();
        }
      }
    ]
  });
  await alert.present();
};
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Joan&display=swap');

/* ================== Header & Toolbar ================== */
.custom-toolbar {
  --background: #9A4444;
  --color: white;
  padding: 5px 0;
}
.header-title {
  font-family: 'Joan', serif;
  font-size: 22px;
  letter-spacing: 0.5px;
  text-align: center;
}
.header-icon {
  font-size: 28px;
}

/* ================== Background ================== */
.custom-bg {
  --background: #f5f5f5;
}
.content-wrapper {
  padding: 20px 15px 80px 15px;
}

/* ================== Empty States ================== */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 60vh;
  text-align: center;
  color: #888;
}
.empty-icon {
  font-size: 70px;
  color: #ddd;
  margin-bottom: 15px;
}
.empty-state h3 {
  font-family: 'Joan', serif;
  font-size: 22px;
  color: #555;
  margin: 0;
}
.empty-state p {
  font-family: 'Inter', sans-serif;
  font-size: 14px;
}

/* ================== Tables Grid ================== */
.tables-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 15px;
}
.table-card {
  background: white;
  border-radius: 18px;
  padding: 15px;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  box-shadow: 0 4px 10px rgba(0,0,0,0.05);
  transition: transform 0.2s, box-shadow 0.2s;
}
.table-card:hover { transform: translateY(-3px); box-shadow: 0 6px 15px rgba(0,0,0,0.1); }

.delete-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  background: rgba(231, 76, 60, 0.1);
  color: #e74c3c;
  border: none;
  border-radius: 50%;
  width: 28px;
  height: 28px;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.2s;
}
.delete-btn:hover { background: #e74c3c; color: white; }

.table-header {
  display: flex;
  justify-content: space-between;
  width: 100%;
  align-items: flex-start;
  margin-bottom: 10px;
}
.table-icon { font-size: 20px; }
.table-status-badge {
  font-family: 'Inter', sans-serif;
  font-size: 10px;
  font-weight: bold;
  padding: 4px 8px;
  border-radius: 10px;
}

.table-number {
  font-family: 'Joan', serif;
  font-size: 36px;
  font-weight: bold;
  line-height: 1;
  margin-bottom: 5px;
}
.table-capacity {
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  color: #888;
}

/* Available Style */
.available { border: 2px solid transparent; }
.available .table-number { color: #333; }
.available .table-icon { color: #2ecc71; }
.available .table-status-badge { background: #e8f8f5; color: #27ae60; }

/* Occupied Style */
.occupied { border: 2px solid #e74c3c; background: #fdf2f0; }
.occupied .table-number { color: #c0392b; }
.occupied .table-icon { color: #e74c3c; }
.occupied .table-status-badge { background: #fadbd8; color: #c0392b; }

/* ================== FAB Button ================== */
.custom-fab-add {
  --background: #9A4444;
  --background-activated: #7a3636;
  --box-shadow: 0 4px 15px rgba(154, 68, 68, 0.4);
}

/* ================== Bottom Sheet Modal ================== */
.custom-bottom-sheet {
  --border-radius: 30px 30px 0 0;
}
.sheet-content {
  padding: 25px 20px;
  background: white;
  height: 100%;
  display: flex;
  flex-direction: column;
}
.sheet-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
  padding-bottom: 15px;
  border-bottom: 1px solid #f0f0f0;
}
.sheet-title {
  font-family: 'Joan', serif;
  font-size: 22px;
  font-weight: bold;
  margin: 0;
  color: #333;
}
.close-icon {
  font-size: 28px;
  color: #888;
  cursor: pointer;
}

/* ================== Forms ================== */
.add-form {
  display: flex;
  flex-direction: column;
  gap: 15px;
}
.input-group {
  display: flex;
  flex-direction: column;
}
.input-label {
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  font-weight: 600;
  color: #666;
  margin-bottom: 8px;
}
.custom-input {
  width: 100%;
  padding: 12px 15px;
  background: #f9f9f9;
  border: 1.5px solid #e0e0e0;
  border-radius: 10px;
  font-family: 'Inter', sans-serif;
  font-size: 16px;
  color: #333;
  outline: none;
  transition: border-color 0.2s;
}
.custom-input:focus {
  border-color: #9A4444;
  background: #ffffff;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: #9A4444;
  color: white;
  font-family: 'Inter', sans-serif;
  font-size: 16px;
  font-weight: bold;
  padding: 15px;
  border-radius: 15px;
  border: none;
  margin-top: 20px;
  cursor: pointer;
  box-shadow: 0 4px 15px rgba(154, 68, 68, 0.3);
  transition: transform 0.1s;
}
.action-btn:active {
  transform: scale(0.98);
}
</style>