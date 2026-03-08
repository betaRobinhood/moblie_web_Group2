<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/staff/dashboard"></ion-back-button>
        </ion-buttons>
        <ion-title>Scan Customer QR</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <div id="qr-reader" style="width: 100%"></div>
      <div v-if="scanning" class="ion-padding ion-text-center">
        <p>Point camera at customer QR code</p>
      </div>
      <div v-if="errorMsg" class="ion-padding ion-text-center">
        <p color="danger">{{ errorMsg }}</p>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonBackButton, IonButtons, modalController, toastController
} from '@ionic/vue';
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
    errorMsg.value = 'Failed to start camera. Please ensure permissions are granted.';
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
      errorMsg.value = 'Invalid QR format: missing UI or RI';
      return;
    }
    
    scanning.value = false;
    if (html5QrCode?.isScanning) await html5QrCode.stop();

    let queueData: any = null;

    if (queueId) {
      // Direct lookup by ID is most efficient
      const docSnap = await getDoc(doc(db, 'queues', queueId));
      if (docSnap.exists()) {
        queueData = { id: docSnap.id, ...docSnap.data() };
      }
    }

    if (!queueData) {
      // Fallback to query
      const q = query(
        collection(db, 'queues'),
        where('userId', '==', userId),
        where('restaurantId', '==', restaurantId),
        where('status', 'in', ['waiting', 'called', 'seated']),
        limit(1) // Remove orderBy to avoid index requirement
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        const queueDoc = snap.docs[0];
        queueData = { id: queueDoc.id, ...queueDoc.data() };
      }
    }
    
    if (!queueData) {
      const toast = await toastController.create({
        message: 'No active queue found for this user.',
        duration: 3000,
        color: 'warning',
        position: 'top'
      });
      await toast.present();
      router.push('/staff/dashboard');
      return;
    }

    if (queueData.status === 'seated') {
      // Show Checkout Modal
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
      // Show Table Assignment Modal
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
    errorMsg.value = `Scan error: ${e.message || 'Unknown error'}`;
    scanning.value = true;
  }
};
</script>

<style scoped>
#qr-reader {
  border-radius: 8px;
  overflow: hidden;
  margin-top: 20px;
}
</style>
