<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar class="custom-toolbar">
        <ion-buttons slot="start">
          <ion-back-button default-href="/home" color="light"></ion-back-button>
        </ion-buttons>
        <ion-title class="header-title">สถานะอาหารของคุณ</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="custom-bg">
      <div class="content-wrapper">
        
        <div v-if="loading" class="empty-state">
          <ion-spinner name="crescent" color="primary"></ion-spinner>
          <p>กำลังดึงข้อมูลออร์เดอร์...</p>
        </div>

        <div v-else-if="userOrders.length === 0" class="empty-state">
          <ion-icon :icon="receiptOutline" class="empty-icon"></ion-icon>
          <p>คุณยังไม่มีรายการสั่งอาหารในขณะนี้</p>
        </div>

        <div class="orders-list" v-else>
          <div v-for="order in userOrders" :key="order.id" class="order-card">
            
            <div class="card-header">
              <div class="status-badge" :class="getStatusClass(order.status)">
                {{ getStatusText(order.status) }}
              </div>
              <div class="time-text">{{ formatTime(order.createdAt) }}</div>
            </div>

            <div class="dashed-divider"></div>

            <div class="card-body">
              <div v-for="(item, idx) in order.items" :key="idx" class="item-row">
                <div class="item-name">
                  <span class="item-qty">{{ item.quantity }}x</span>
                  <span>{{ getItemName(item) }}</span>
                </div>
                <div class="item-price">{{ (item.price * item.quantity).toFixed(0) }} THB</div>
              </div>
            </div>

            <div class="solid-divider"></div>

            <div class="card-footer">
              <span class="total-label">ยอดรวมทั้งหมด</span>
              <span class="total-amount">{{ order.totalAmount || calculateTotal(order.items) }} THB</span>
            </div>

          </div>
        </div>

      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton, IonIcon, IonSpinner } from '@ionic/vue';
import { receiptOutline } from 'ionicons/icons';
import { db } from '../../services/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { useUserStore } from '../../stores/userStore';

const userStore = useUserStore();
const userOrders = ref<any[]>([]);
const loading = ref(true);
let orderSub: any = null;

const loadOrders = () => {
  if (!userStore.user?.uid) {
    loading.value = false;
    return;
  }
  
  loading.value = true;
  const q = query(collection(db, 'orders'), where('userId', '==', userStore.user.uid));

  if (orderSub) orderSub();

  orderSub = onSnapshot(q, (snapshot) => {
    const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
    
    // เรียงจากออร์เดอร์ใหม่ล่าสุดขึ้นก่อน
    orders.sort((a, b) => {
      const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
      const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
      return timeB - timeA;
    });
    
    userOrders.value = orders;
    loading.value = false;
  });
};

onMounted(() => loadOrders());

watch(() => userStore.user, (newVal) => {
  if (newVal) loadOrders();
});

onUnmounted(() => {
  if (orderSub) orderSub();
});

// ฟังก์ชันดึงชื่ออาหาร
const getItemName = (item: any) => {
  if (item.name?.th) return item.name.th;
  if (item.name?.en) return item.name.en;
  return item.name || 'ไม่ทราบชื่อเมนู';
};

// คำนวณยอดรวม (กรณีไม่มี totalAmount ใน DB)
const calculateTotal = (items: any[]) => {
  if (!items) return 0;
  return items.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(0);
};

// แปลงเวลาให้สวยงาม
const formatTime = (timestamp: any) => {
  if (!timestamp) return '';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

// ================== ตั้งค่าป้ายสถานะ (อิงตามรูป) ==================

// ข้อความบนป้าย
const getStatusText = (status: string) => {
  switch (status) {
    case 'pending': return 'รอรับออร์เดอร์';
    case 'preparing': return 'กำลังเตรียม';
    case 'ready': return 'พร้อมเสิร์ฟ';
    case 'served': return 'เสิร์ฟแล้ว';  // ตรงตามรูป
    case 'paid': return 'ชำระเงินแล้ว';
    case 'cancelled': return 'ยกเลิกแล้ว';
    default: return 'ดำเนินการ';
  }
};

// สีของป้าย (Class)
const getStatusClass = (status: string) => {
  switch (status) {
    case 'pending': return 'badge-pending';
    case 'preparing': return 'badge-preparing';
    case 'ready': return 'badge-ready';
    case 'served': return 'badge-served'; // ใช้สีฟ้าแบบในรูป
    case 'paid': return 'badge-paid';
    case 'cancelled': return 'badge-cancelled';
    default: return 'badge-default';
  }
};
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Joan&display=swap');

.custom-toolbar {
  --background: #9A4444;
  --color: white;
  padding: 5px 0;
}
.header-title {
  font-family: 'Joan', serif;
  font-size: 20px;
  text-align: center;
}

.custom-bg {
  --background: #f8f9fa; /* พื้นหลังสีเทาอ่อนให้กล่องดูเด่น */
}
.content-wrapper {
  padding: 15px;
}

/* ================== Empty State ================== */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 60vh;
  color: #888;
}
.empty-icon { font-size: 60px; color: #ddd; margin-bottom: 10px; }
.empty-state p { font-family: 'Inter', sans-serif; font-size: 15px; }

/* ================== Order Cards (แบบในรูป) ================== */
.orders-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.order-card {
  background: #ffffff;
  border-radius: 16px;
  padding: 16px 20px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.05);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.time-text {
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  color: #999;
}

/* เส้นประ (Dashed Divider แบบในรูป) */
.dashed-divider {
  border-top: 1px dashed #e0e0e0;
  margin: 15px 0;
}

.solid-divider {
  border-top: 1px solid #f0f0f0;
  margin: 15px 0;
}

/* ================== รายการอาหาร (Items) ================== */
.card-body {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.item-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-family: 'Inter', sans-serif;
  font-size: 15px;
  color: #333;
}

.item-name {
  display: flex;
  gap: 8px;
  flex: 1;
}

.item-qty {
  font-weight: bold;
  color: #9A4444;
}

.item-price {
  color: #888; /* สีเทาแบบในรูป */
  min-width: 60px;
  text-align: right;
}

/* ================== Footer ยอดรวม ================== */
.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-family: 'Inter', sans-serif;
  font-weight: bold;
}

.total-label {
  font-size: 14px;
  color: #333;
}

.total-amount {
  font-size: 18px;
  color: #9A4444;
}

/* ================== สีป้ายสถานะ (Badges) ================== */
.status-badge {
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  font-weight: 600;
  padding: 6px 14px;
  border-radius: 20px;
  display: inline-block;
}

/* ป้ายสีฟ้า "เสิร์ฟแล้ว" (เหมือนรูปเป๊ะ) */
.badge-served { background-color: #e0f2fe; color: #0284c7; }

/* ป้ายสถานะอื่นๆ */
.badge-pending { background-color: #f1f5f9; color: #64748b; }
.badge-preparing { background-color: #fef3c7; color: #d97706; }
.badge-ready { background-color: #dcfce7; color: #16a34a; }
.badge-paid { background-color: #fce7f3; color: #db2777; }
.badge-cancelled { background-color: #fee2e2; color: #dc2626; }
.badge-default { background-color: #f3f4f6; color: #374151; }
</style>