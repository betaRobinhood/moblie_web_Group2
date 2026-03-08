<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar class="transparent-toolbar">
        <ion-buttons slot="start">
          <ion-back-button default-href="/home" color="light"></ion-back-button>
        </ion-buttons>
        <ion-title class="page-title">รับคิว</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true" class="custom-bg">
      
      <div v-if="queueStore.loading" class="center-content">
        <ion-spinner name="crescent" color="light"></ion-spinner>
      </div>

      <div v-else-if="queueStore.activeQueue" class="ticket-wrapper">
        <div class="ticket-card">
          
          <div class="brand-logo">
            <span class="small-txt">THAI RESTAURANT</span>
            <span class="x-mark">X</span>
            <span class="big-txt">EzyDine</span>
          </div>

          <div class="qr-section">
            <qrcode-vue :value="qrValue" :size="200" level="H" class="qr-code" />
            <div class="timer">
              <ion-icon :icon="refreshOutline"></ion-icon>
              <span>5:10</span>
            </div>
          </div>

          <div class="info-section">
            <h2 class="section-title">ข้อมูลการจองคิว</h2>

            <div class="restaurant-row">
              <div class="avatar">
                <img src="https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=150&q=80" alt="Chef" />
              </div>
              <div class="res-details">
                <h3>{{ restaurant?.name[locale?.value || 'en'] || 'Thai Resy' }}</h3>
                <p><ion-icon :icon="locationOutline"></ion-icon> {{ restaurant?.location || 'โลตัส โนนม่วง' }}</p>
              </div>
            </div>

            <div class="queue-numbers">
              <div class="q-box">
                <p>หมายเลขคิวของคุณ</p>
                <h1>{{ queueStore.activeQueue.position }}</h1>
              </div>
              <div class="q-divider"></div>
              <div class="q-box">
                <p>คิวปัจจุบัน</p>
                <h1>{{ queueStore.activeQueue.position }}</h1> 
              </div>
            </div>

            <div class="booking-details">
              <div class="detail-line">
                <ion-icon :icon="calendarOutline" class="detail-icon"></ion-icon>
                <span class="label">เวลา</span>
                <span class="value">: {{ formattedDate }} น.</span>
              </div>
              <div class="detail-line">
                <ion-icon :icon="peopleOutline" class="detail-icon"></ion-icon>
                <span class="label">จำนวนที่นั่ง</span>
                <span class="value">: {{ queueStore.activeQueue.partySize }} ท่าน</span>
              </div>
            </div>

            <button class="cancel-btn" @click="cancelQueue" :disabled="cancelling">
              <ion-spinner v-if="cancelling" name="crescent" class="btn-spinner"></ion-spinner>
              <span v-else>ยกเลิกการจอง</span>
            </button>
          </div>
        </div>
      </div>

      <div v-else class="center-content empty-state">
        <ion-icon :icon="ticketOutline" size="large"></ion-icon>
        <h3>No Active Queue</h3>
        <p>You haven't joined any restaurant queue yet.</p>
        <button class="find-res-btn" @click="router.push('/home')">Find Restaurants</button>
      </div>

    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonBackButton, IonButtons, IonSpinner, IonIcon
} from '@ionic/vue';
import { 
  ticketOutline, refreshOutline, locationOutline, 
  calendarOutline, peopleOutline
} from 'ionicons/icons';
import QrcodeVue from 'qrcode.vue';
import { useQueueStore } from '../../stores/queueStore';
import { useUserStore } from '../../stores/userStore';
import { useRestaurantStore } from '../../stores/restaurantStore';
import { db } from '../../services/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';

const queueStore = useQueueStore();
const userStore = useUserStore();
const restaurantStore = useRestaurantStore();
const router = useRouter();

const i18n = useI18n();
const locale = i18n?.locale as { value: 'en' | 'th' } | undefined;

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

// คำนวณข้อมูลร้านอาหารของคิวปัจจุบัน
const restaurant = computed(() => {
  if (!queueStore.activeQueue) return null;
  return restaurantStore.restaurants.find((r: any) => r.id === queueStore.activeQueue?.restaurantId);
});

// รูปแบบวันที่จำลองให้ตรงกับดีไซน์ (ถ้าใน Data มี createdAt สามารถนำมาแปลงได้)
const formattedDate = computed(() => {
  const d = new Date();
  return `${d.getDate()}/${d.getMonth()+1}/${d.getFullYear().toString().slice(-2)} ${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}`;
});

const qrValue = computed(() => {
  if (!queueStore.activeQueue) return '';
  return JSON.stringify({
    uid: userStore.user?.uid,
    qid: queueStore.activeQueue.id,
    rid: queueStore.activeQueue.restaurantId
  });
});

const cancelQueue = async () => {
  if (!queueStore.activeQueue) return;
  cancelling.value = true;
  try {
    await updateDoc(doc(db, 'queues', queueStore.activeQueue.id), { status: 'cancelled' });
    router.push('/home'); // ยกเลิกเสร็จเด้งกลับหน้าแรก
  } catch (error) {
    console.error(error);
  } finally {
    cancelling.value = false;
  }
};
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Joan&display=swap');

/* ================= พื้นหลังหลัก ================= */
.custom-bg {
  /* กำหนดสีพื้นหลังให้เต็มจอ เพื่อไม่ให้เห็นขอบขาว */
  --background: #9A4444; 
}

.transparent-toolbar {
  --background: #9A4444;
  --border-color: transparent;
}

.page-title {
  font-family: 'Inter', sans-serif;
  font-size: 16px;
  color: #FFFFFF; /* เปลี่ยนเป็นสีขาวให้อ่านง่ายบนพื้นแดง */
  text-align: left;
  padding-left: 0;
}

/* ================= พื้นที่ตั๋ว (Ticket) ================= */
.ticket-wrapper {
  display: flex;
  justify-content: center;
  padding: 10px 20px 40px 20px;
  width: 100%;
  min-height: 100%; /* ให้ความสูงยืดหยุ่นเต็มจอเสมอ */
}

.ticket-card {
  background: #FFFFFF;
  border-radius: 15px;
  width: 100%;
  max-width: 400px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  box-shadow: 0px 4px 15px rgba(0,0,0,0.2);
}

/* ================= โลโก้ในตั๋ว ================= */
.brand-logo {
  background: #9A4444;
  color: white;
  width: 90px;
  padding: 8px;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
}
.small-txt { font-size: 6px; font-family: 'Inter', sans-serif; }
.x-mark { font-size: 8px; margin: 2px 0; }
.big-txt { font-family: 'Joan', serif; font-size: 16px; font-weight: bold; }

/* ================= QR Code ================= */
.qr-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 25px;
}
.qr-code {
  border-radius: 10px;
}
.timer {
  display: flex;
  align-items: center;
  gap: 5px;
  color: #888;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  margin-top: 10px;
}

/* ================= ข้อมูลการจอง ================= */
.section-title {
  font-family: 'Inter', sans-serif;
  font-size: 18px;
  font-weight: 600;
  color: #000;
  margin: 0 0 15px 0;
}

.restaurant-row {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 20px;
}
.avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: #9A4444;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2px;
}
.avatar img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}
.res-details h3 {
  margin: 0;
  font-family: 'Inter', sans-serif;
  font-size: 15px;
  font-weight: 600;
  color: #000;
}
.res-details p {
  margin: 5px 0 0 0;
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  color: #666;
  display: flex;
  align-items: center;
  gap: 4px;
}

/* ================= หมายเลขคิว ================= */
.queue-numbers {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  padding: 0 10px;
}
.q-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 45%;
}
.q-box p {
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  font-weight: 600;
  color: #000;
  margin: 0 0 5px 0;
}
.q-box h1 {
  font-family: 'Inter', sans-serif;
  font-size: 38px;
  font-weight: bold;
  color: #000;
  margin: 0;
}
.q-divider {
  width: 1px;
  height: 40px;
  background: rgba(0,0,0,0.3);
}

/* ================= รายละเอียด (เวลา/ที่นั่ง) ================= */
.booking-details {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 30px;
  padding-left: 10px;
}
.detail-line {
  display: flex;
  align-items: center;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  color: #000;
  font-weight: 600;
}
.detail-icon {
  font-size: 18px;
  margin-right: 15px;
  color: #000;
}
.label {
  width: 80px;
}

/* ================= ปุ่มยกเลิก ================= */
.cancel-btn {
  background: #000000;
  color: #FFFFFF;
  width: 100%;
  height: 45px;
  border-radius: 30px;
  font-family: 'Inter', sans-serif;
  font-size: 18px;
  font-weight: 500;
  border: none;
  box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.25);
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  margin-top: auto; 
}
.cancel-btn:active {
  transform: scale(0.98);
}
.btn-spinner {
  color: white;
}

/* ================= Empty State ================= */
.center-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 80vh;
  color: white;
}
.empty-state h3 {
  font-family: 'Inter', sans-serif;
  font-weight: bold;
  color: white;
}
.empty-state p {
  color: rgba(255,255,255,0.8);
  font-family: 'Inter', sans-serif;
}
.find-res-btn {
  background: #FFFFFF;
  color: #9A4444;
  padding: 12px 25px;
  border-radius: 20px;
  font-family: 'Inter', sans-serif;
  font-weight: bold;
  margin-top: 15px;
}
</style>