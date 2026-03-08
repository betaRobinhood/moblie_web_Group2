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
  IonBackButton, IonButtons, toastController
} from '@ionic/vue';
import { Html5Qrcode } from 'html5-qrcode';
import { useRouter } from 'vue-router';
import { db } from '../../services/firebase';
import { doc, updateDoc } from 'firebase/firestore';

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
    if (!data.qid) {
      errorMsg.value = 'Invalid QR code format.';
      return;
    }
    
    scanning.value = false;
    
    if (html5QrCode?.isScanning) {
      await html5QrCode.stop();
    }

    await updateDoc(doc(db, 'queues', data.qid), {
      status: 'seated',
      seatedAt: new Date()
    });

    const toast = await toastController.create({
      message: 'Customer checked in successfully!',
      duration: 2000,
      color: 'success',
      position: 'top'
    });
    await toast.present();

    setTimeout(() => router.push('/staff/dashboard'), 1000);
  } catch (e) {
    console.error('QR scan error', e);
    // If it's not valid JSON, it's just a wrong QR
    if (e instanceof SyntaxError) {
      errorMsg.value = 'Invalid QR code content.';
    }
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
