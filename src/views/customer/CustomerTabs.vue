<template>
  <ion-page>
    <ion-tabs>
      <ion-router-outlet></ion-router-outlet>
      
      <ion-tab-bar slot="bottom" class="custom-tab-bar">
        
        <ion-tab-button v-if="!hasQueue" tab="home" href="/home">
          <ion-icon :icon="home"></ion-icon>
        </ion-tab-button>

        <ion-tab-button v-if="hasQueue" tab="queue" href="/my-queue">
          <ion-icon :icon="time"></ion-icon>
        </ion-tab-button>
        
        <ion-tab-button v-if="hasQueue" tab="cart" href="/cart">
          <ion-icon :icon="basket"></ion-icon>
        </ion-tab-button>

        <ion-tab-button tab="notifications" href="/notifications">
          <ion-icon :icon="notifications"></ion-icon>
        </ion-tab-button>
        
        <ion-tab-button tab="profile" href="/profile">
          <ion-icon :icon="person"></ion-icon>
        </ion-tab-button>

      </ion-tab-bar>
    </ion-tabs>
  </ion-page>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { IonPage, IonTabs, IonRouterOutlet, IonTabBar, IonTabButton, IonIcon } from '@ionic/vue';
import { home, time, basket, notifications, person } from 'ionicons/icons';

// นำเข้า Store เพื่อดึงข้อมูลคิวแบบ Real-time
import { useQueueStore } from '../../stores/queueStore';

const queueStore = useQueueStore();

// คำนวณแบบอัตโนมัติว่า "ตอนนี้มีคิวอยู่หรือไม่?" (ถ้ามี = true, ไม่มี = false)
const hasQueue = computed(() => !!queueStore.activeQueue);
</script>

<style scoped>
/* ================== ดีไซน์ Navbar ================== */
.custom-tab-bar {
  /* ไล่สีพื้นหลังส้ม-แดง ตามดีไซน์ */
  --background: linear-gradient(180deg, #DD7631 3%, #AF543E 37.1%, #9A4444 67.6%);
  --border: none;
  height: 65px; 
}

/* ================== ดีไซน์ปุ่มและไอคอน ================== */
ion-tab-button {
  --color: #4a2121; /* สีน้ำตาลเข้มตอนที่ไม่ได้เลือก */
  --color-selected: #FFFFFF; /* สีขาวตอนที่ถูกเลือก */
  --background-focused: transparent;
  --ripple-color: transparent;
  transition: all 0.3s ease; /* เพิ่มความนุ่มนวลตอนสลับปุ่ม */
}

ion-tab-button ion-icon {
  font-size: 28px; 
  margin-top: 5px;
}
</style>