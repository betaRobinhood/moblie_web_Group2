<template>
  <ion-content class="ion-padding ion-text-center modal-content">
    <div class="call-wrapper">
      <div class="icon-pulse">
        <ion-icon :icon="notificationsOutline" class="call-icon"></ion-icon>
      </div>
      
      <h2 class="call-title">ถึงคิวของคุณแล้ว!</h2>
      <div class="q-number-circle">
        <span class="q-label">หมายเลขคิว</span>
        <span class="q-value">{{ queueNumber }}</span>
      </div>
      
      <p class="call-sub">กรุณามารายงานตัวที่หน้าเคาน์เตอร์ร้าน<br>เพื่อรับโต๊ะที่นั่งครับ</p>
      
      <ion-button expand="block" class="acknowledge-btn" @click="dismiss">
        รับทราบแล้ว (Got it!)
      </ion-button>
    </div>
  </ion-content>
</template>

<script setup lang="ts">
import {
  IonContent, IonIcon, IonButton, modalController
} from '@ionic/vue';
import { notificationsOutline } from 'ionicons/icons';

defineProps<{
  queueNumber: number | string;
  restaurantName?: string;
}>();

const dismiss = () => modalController.dismiss();
</script>

<style scoped>
.modal-content {
  --background: #fff;
}

.call-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 20px;
}

.icon-pulse {
  background: rgba(154, 68, 68, 0.1);
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
  animation: pulse 2s infinite;
}

.call-icon {
  font-size: 40px;
  color: #9A4444;
}

.call-title {
  font-family: 'Joan', serif;
  font-size: 24px;
  font-weight: bold;
  color: #9A4444;
  margin-bottom: 20px;
}

.q-number-circle {
  border: 4px solid #9A4444;
  width: 150px;
  height: 150px;
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin-bottom: 25px;
}

.q-label {
  font-size: 14px;
  color: #666;
}

.q-value {
  font-size: 48px;
  font-weight: bold;
  color: #000;
}

.call-sub {
  font-size: 16px;
  color: #333;
  margin-bottom: 30px;
  line-height: 1.5;
}

.acknowledge-btn {
  --background: #9A4444;
  --border-radius: 30px;
  --height: 50px;
  font-weight: bold;
  width: 100%;
}

@keyframes pulse {
  0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(154, 68, 68, 0.7); }
  70% { transform: scale(1); box-shadow: 0 0 0 15px rgba(154, 68, 68, 0); }
  100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(154, 68, 68, 0); }
}
</style>
