<template>
  <ion-page>
    <ion-tabs>
      <ion-router-outlet></ion-router-outlet>
      
      <ion-tab-bar slot="bottom" class="custom-tab-bar">
        
        <ion-tab-button v-if="!hasQueue" tab="home" href="/home">
          <ion-icon :icon="home"></ion-icon>
          <ion-label>หน้าหลัก</ion-label>
        </ion-tab-button>

        <ion-tab-button v-if="hasQueue && queueStore.activeQueue?.status !== 'seated'" tab="queue" href="/my-queue">
          <ion-icon :icon="time"></ion-icon>
          <ion-label>คิวของคุณ</ion-label>
        </ion-tab-button>

        <ion-tab-button v-if="hasQueue && queueStore.activeQueue?.status === 'seated'" tab="order" :href="`/restaurant/${queueStore.activeQueue.restaurantId}/menu`">
          <ion-icon :icon="basket"></ion-icon>
          <ion-label>สั่งอาหาร</ion-label>
        </ion-tab-button>

        <ion-tab-button v-if="hasQueue && queueStore.activeQueue?.status === 'seated'" tab="status" :href="`/restaurant/${queueStore.activeQueue.restaurantId}/order-status`">
          <ion-icon :icon="fastFood"></ion-icon>
          <ion-label>สถานะ/เช็คเอาต์</ion-label>
        </ion-tab-button>
        
        <ion-tab-button tab="notifications" href="/notifications">
          <ion-icon :icon="receiptOutline"></ion-icon>
          <ion-label>ประวัติใช้งาน</ion-label>
        </ion-tab-button>
        
        <ion-tab-button tab="profile" href="/profile">
          <ion-icon :icon="person"></ion-icon>
          <ion-label>โปรไฟล์</ion-label>
        </ion-tab-button>

      </ion-tab-bar>
    </ion-tabs>
  </ion-page>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, watch } from 'vue';
import { IonPage, IonTabs, IonRouterOutlet, IonTabBar, IonTabButton, IonIcon, IonLabel, modalController } from '@ionic/vue';
import { home, time, basket, receiptOutline, person, fastFood } from 'ionicons/icons';

// นำเข้า Store เพื่อดึงข้อมูลคิวแบบ Real-time
import { useQueueStore } from '../../stores/queueStore';
import { useUserStore } from '../../stores/userStore';
import QueueCallModal from '../../components/QueueCallModal.vue';

const queueStore = useQueueStore();
const userStore = useUserStore();

let queueSub: (() => void) | null = null;

onMounted(() => {
  if (userStore.user) {
    queueSub = queueStore.subscribeToUserQueue(userStore.user.uid);
  }
});

onUnmounted(() => {
  queueSub?.();
});

// ตรวจจับเมื่อสถานะคิวเปลี่ยนเป็น 'called'
watch(() => queueStore.activeQueue?.status, async (newStatus, oldStatus) => {
  if (newStatus === 'called' && oldStatus !== 'called') {
    const modal = await modalController.create({
      component: QueueCallModal,
      componentProps: {
        queueNumber: queueStore.activeQueue?.position ?? '?'
      }
    });
    await modal.present();
  }
});

// คำนวณแบบอัตโนมัติว่า "ตอนนี้มีคิวอยู่หรือไม่?" (ถ้ามี = true, ไม่มี = false)
const hasQueue = computed(() => !!queueStore.activeQueue);
</script>

<style scoped>
/* ================== ดีไซน์ Navbar ================== */
.custom-tab-bar {
  /* ไล่สีพื้นหลังส้ม-แดง ตามดีไซน์ */
  --background: linear-gradient(180deg, #DD7631 3%, #AF543E 37.1%, #9A4444 67.6%);
  --border: none;
  height: 75px; 
}

/* ================== ดีไซน์ปุ่มและไอคอน ================== */
ion-tab-button {
  --color: #ffe4e4; /* สีน้ำตาลอ่อนตอนที่ไม่ได้เลือก */
  --color-selected: #FFFFFF; /* สีขาวตอนที่ถูกเลือก */
  --background-focused: transparent;
  --ripple-color: transparent;
  transition: all 0.3s ease;
}

ion-tab-button ion-icon {
  font-size: 24px; 
  margin-bottom: 2px;
}

ion-tab-button ion-label {
  font-size: 10px;
  font-weight: 500;
}
</style>