<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar class="custom-toolbar">
        <ion-buttons slot="start">
          <ion-back-button default-href="/staff/dashboard" color="light"></ion-back-button>
        </ion-buttons>
        <ion-title class="header-title">สแกน QR Code</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="custom-bg" :fullscreen="true">
      <div class="scanner-container">
        
        <div class="instruction-box">
          <ion-icon :icon="scanOutline" class="scan-icon"></ion-icon>
          <h2>สแกนเพื่อยืนยันคิว</h2>
          <p>นำกล้องส่องไปที่ QR Code ของลูกค้าเพื่อเปลี่ยนสถานะเข้าโต๊ะ หรือ สรุปยอดชำระเงิน</p>
        </div>

        <div class="camera-wrapper">
          <div id="qr-reader" class="qr-reader-view"></div>
          <div class="scan-focus-frame">
            <div class="corner top-left"></div>
            <div class="corner top-right"></div>
            <div class="corner bottom-left"></div>
            <div class="corner bottom-right"></div>
          </div>
        </div>

        <div v-if="scanning" class="status-message scanning">
          <ion-spinner name="dots" color="light"></ion-spinner>
          <span>กำลังค้นหา QR Code...</span>
        </div>

        <div v-if="errorMsg" class="status-message error">
          <ion-icon :icon="warningOutline"></ion-icon>
          <span>{{ errorMsg }}</span>
        </div>

      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonBackButton, IonButtons, IonIcon, IonSpinner, modalController, toastController
} from '@ionic/vue';
import { scanOutline, warningOutline } from 'ionicons/icons';
import { Html5Qrcode } from 'html5-qrcode';
import { useRouter } from 'vue-router';
import TablePickerModal from '../../components/TablePickerModal.vue';
import CheckoutModal from '../../components/CheckoutModal.vue';
import { db } from '../../services/firebase';
import { collection, query, where, getDocs, limit, doc, getDoc } from 'firebase/firestore';

const router = useRouter();
const scanning = ref(true);
const errorMsg = ref('');
let html5QrCode: Html5Qrcode | null = null;

onMounted(async () => {
  html5QrCode = new Html5Qrcode('qr-reader');
  try {
    await html5QrCode.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 250, height: 250 } },
      onScanSuccess,
      () => { /* ignore */ }
    );
  } catch (err) {
    console.error('Failed to start scanner', err);
    errorMsg.value = 'ไม่สามารถเปิดกล้องได้ กรุณาตรวจสอบสิทธิ์การเข้าถึงกล้องถ่ายรูป';
    scanning.value = false;
  }
});

onUnmounted(async () => {
  if (html5QrCode && html5QrCode.isScanning) {
    try {
      await html5QrCode.stop();
    } catch (e) {
      console.error('Stop error', e);
    }
  }
});

const onScanSuccess = async (decodedText: string) => {
  if (!scanning.value) return;

  try {
    const data = JSON.parse(decodedText);
    const userId = data.uid || data.userId;
    const restaurantId = data.rid || data.restaurantId;
    const queueId = data.qid || data.queueId;
    
    if (!userId || !restaurantId) {
      errorMsg.value = 'รูปแบบ QR Code ไม่ถูกต้อง';
      return;
    }
    
    scanning.value = false;
    if (html5QrCode?.isScanning) await html5QrCode.stop();

    let queueData: any = null;

    if (queueId) {
      const docSnap = await getDoc(doc(db, 'queues', queueId));
      if (docSnap.exists()) {
        queueData = { id: docSnap.id, ...docSnap.data() };
      }
    }

    if (!queueData) {
      const q = query(
        collection(db, 'queues'),
        where('userId', '==', userId),
        where('restaurantId', '==', restaurantId),
        where('status', 'in', ['waiting', 'called', 'seated']),
        limit(1)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        const queueDoc = snap.docs[0];
        queueData = { id: queueDoc.id, ...queueDoc.data() };
      }
    }
    
    if (!queueData) {
      const toast = await toastController.create({
        message: 'ไม่พบคิวที่เปิดใช้งานอยู่ของลูกค้ารายนี้',
        duration: 3000, color: 'warning', position: 'top'
      });
      await toast.present();
      router.push('/staff/dashboard');
      return;
    }

    // แยกว่าสแกนตอนเข้าโต๊ะ หรือตอนเช็คบิล
    if (queueData.status === 'seated') {
      const modal = await modalController.create({
        component: CheckoutModal,
        componentProps: {
          restaurantId: queueData.restaurantId,
          userId: queueData.userId,
          tableNumber: queueData.tableNumber,
          tableId: queueData.tableId,
          queueId: queueData.id
        }
      });
      await modal.present();
      await modal.onWillDismiss();
      router.push('/staff/dashboard');
    } else {
      const modal = await modalController.create({
        component: TablePickerModal,
        componentProps: {
          restaurantId: queueData.restaurantId,
          queueId: queueData.id
        },
        breakpoints: [0, 0.5, 0.9],
        initialBreakpoint: 0.5
      });
      await modal.present();
      await modal.onWillDismiss();
      router.push('/staff/dashboard');
    }
  } catch (e: any) {
    console.error('QR scan processing error', e);
    errorMsg.value = `เกิดข้อผิดพลาดในการสแกน: ${e.message || 'Unknown error'}`;
    scanning.value = true;
  }
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

/* ================== Background & Layout ================== */
.custom-bg {
  --background: #1a1a1a; /* พื้นหลังสีดำเข้มให้กล้องเด่นขึ้น */
}
.scanner-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
  padding: 20px;
}

/* ================== Instruction Box ================== */
.instruction-box {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  padding: 20px;
  text-align: center;
  margin-bottom: 30px;
  width: 100%;
  max-width: 400px;
  border: 1px solid rgba(255, 255, 255, 0.2);
}
.scan-icon {
  font-size: 40px;
  color: #DD7631; /* สีส้มอุ่นเข้าธีม */
  margin-bottom: 10px;
}
.instruction-box h2 {
  font-family: 'Joan', serif;
  font-size: 22px;
  color: white;
  margin: 0 0 5px 0;
}
.instruction-box p {
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  color: #ccc;
  margin: 0;
  line-height: 1.5;
}

/* ================== Camera Wrapper & Focus Frame ================== */
.camera-wrapper {
  position: relative;
  width: 100%;
  max-width: 350px;
  aspect-ratio: 1/1;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0,0,0,0.5);
  background: #000;
  display: flex;
  justify-content: center;
  align-items: center;
}
.qr-reader-view {
  width: 100%;
  height: 100%;
  /* ปรับแต่งปุ่มและข้อความที่มาจาก library ให้อ่านยากน้อยลง */
}
:deep(#qr-reader img) { display: none; } /* ซ่อนโลโก้ library */
:deep(#qr-reader__dashboard_section_csr span) { color: white !important; font-family: 'Inter', sans-serif; }
:deep(#qr-reader button) {
  background: #9A4444 !important;
  color: white !important;
  border: none !important;
  border-radius: 8px !important;
  padding: 8px 15px !important;
  font-family: 'Inter', sans-serif !important;
}

/* มุมเล็ง (Focus Overlay) */
.scan-focus-frame {
  position: absolute;
  top: 15%; left: 15%; right: 15%; bottom: 15%;
  pointer-events: none;
}
.corner {
  position: absolute;
  width: 30px;
  height: 30px;
  border-color: #DD7631; /* สีส้ม */
  border-style: solid;
  transition: all 0.3s;
}
.top-left { top: 0; left: 0; border-width: 4px 0 0 4px; border-top-left-radius: 10px; }
.top-right { top: 0; right: 0; border-width: 4px 4px 0 0; border-top-right-radius: 10px; }
.bottom-left { bottom: 0; left: 0; border-width: 0 0 4px 4px; border-bottom-left-radius: 10px; }
.bottom-right { bottom: 0; right: 0; border-width: 0 4px 4px 0; border-bottom-right-radius: 10px; }

/* ================== Status Messages ================== */
.status-message {
  margin-top: 30px;
  padding: 12px 25px;
  border-radius: 30px;
  display: flex;
  align-items: center;
  gap: 10px;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  font-weight: 500;
}
.scanning {
  background: rgba(255, 255, 255, 0.15);
  color: white;
}
.error {
  background: rgba(231, 76, 60, 0.2);
  color: #ff6b6b;
  border: 1px solid rgba(231, 76, 60, 0.4);
}
.error ion-icon {
  font-size: 20px;
}
</style>