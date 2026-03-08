<template>
  <ion-page>
    <ion-content :fullscreen="true" class="custom-bg">
      <div class="top-gradient"></div>

      <div class="notification-card">
        <div class="header-row">
          <ion-icon :icon="arrowBackCircleOutline" class="back-btn" @click="router.push('/home')"></ion-icon>
          <h1 class="page-title">การแจ้งเตือน</h1>
        </div>

        <div class="list-container">
          <div class="noti-item active-noti">
            <div class="icon-circle success-bg">
              <ion-icon :icon="checkmarkOutline"></ion-icon>
            </div>
            <p>ท่านได้ทำการชำระเงินเรียบร้อยแล้ว</p>
          </div>

          <hr class="divider">

          <div class="noti-item">
            <div class="icon-circle wait-bg">
              <ion-icon :icon="hourglassOutline"></ion-icon>
            </div>
            <p>ห้องครัวได้รับออร์เดอร์แล้ว กรุณารอซักครู่</p>
          </div>

          <hr class="divider">

          <div class="noti-item">
            <div class="icon-circle cancel-bg">
              <ion-icon :icon="closeOutline"></ion-icon>
            </div>
            <p>ออร์เดอร์ถูกยกเลิกโดยร้านอาหาร</p>
          </div>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonPage, IonContent, IonIcon } from '@ionic/vue';
import { arrowBackCircleOutline, checkmarkOutline, hourglassOutline, closeOutline } from 'ionicons/icons';
import { useRouter } from 'vue-router';

const router = useRouter();
</script>

<style scoped>
.custom-bg { --background: #f5f5f5; }

.top-gradient {
  position: fixed;
  top: 0; left: 0; width: 100%; height: 250px;
  background: linear-gradient(180deg, #9A4444 0%, #DD7631 100%);
  z-index: 0;
}

.notification-card {
  position: relative;
  background: #FFFFFF;
  border-radius: 30px;
  margin: 60px 20px 20px 20px;
  padding: 20px;
  z-index: 2;
  min-height: 70vh;
  box-shadow: 0px 4px 15px rgba(0,0,0,0.1);
}

.header-row {
  display: flex;
  align-items: center;
  margin-bottom: 30px;
}

.back-btn { font-size: 32px; color: #9A4444; cursor: pointer; }

.page-title {
  width: 100%;
  text-align: center;
  font-size: 24px;
  margin: 0;
  padding-right: 32px; /* ดันให้ตรงกลาง */
  font-weight: bold;
}

.noti-item { display: flex; align-items: center; gap: 15px; padding: 10px 0; }
.noti-item p { margin: 0; font-size: 14px; color: #333; }
.active-noti { border: 2px solid #3498db; border-radius: 10px; padding: 15px 10px; }

.icon-circle {
  width: 40px; height: 40px; border-radius: 50%; display: flex; justify-content: center; align-items: center; color: white; font-size: 20px; flex-shrink: 0;
}
.success-bg { background: #9A4444; }
.wait-bg { background: #AF543E; }
.cancel-bg { background: #000000; }

.divider { border: none; border-top: 1px solid #eee; margin: 10px 0; }
</style>