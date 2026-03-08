<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar class="custom-toolbar">
        <ion-title class="header-title">ตะกร้าของคุณ</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true" class="custom-bg">
      <div class="cart-container">
        
        <div v-if="cartStore.items.length === 0" class="empty-state">
          <ion-icon :icon="basketOutline" class="empty-icon"></ion-icon>
          <h2>ตะกร้าว่างเปล่า</h2>
          <p>คุณยังไม่ได้เลือกเมนูอาหารเลย<br>ลองดูร้านอาหารที่น่าสนใจในหน้าหลักสิ</p>
          <button class="action-btn" @click="router.push('/home')">ค้นหาร้านอาหาร</button>
        </div>

        <div v-else class="active-cart-state">
          <div class="preview-card">
            <div class="preview-header">
              <ion-icon :icon="restaurantOutline"></ion-icon>
              <h3>รายการอาหารที่รอสั่ง</h3>
            </div>
            
            <div class="preview-body">
              <p>คุณมี <strong>{{ cartStore.itemCount }}</strong> รายการในตะกร้า</p>
              <p>ยอดรวมเบื้องต้น: <strong>{{ cartStore.totalPrice }} THB</strong></p>
            </div>

            <button class="action-btn checkout-btn" @click="goToCheckout">
              ดูรายละเอียดและสั่งอาหาร
            </button>
          </div>
        </div>

      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonIcon } from '@ionic/vue';
import { basketOutline, restaurantOutline } from 'ionicons/icons';
import { useRouter } from 'vue-router';
import { useCartStore } from '../../stores/cartStore';

const router = useRouter();
const cartStore = useCartStore();

const goToCheckout = () => {
  // ดึง restaurantId จาก Store (ที่เราเซ็ตไว้ตอนกดเมนู)
  if (cartStore.restaurantId) {
    router.push(`/restaurant/${cartStore.restaurantId}/cart`);
  }
};
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600&family=Joan&display=swap');

.custom-toolbar { --background: #8b3c3c; --color: white; padding: 5px 0; }
.header-title { font-family: 'Joan', serif; font-size: 24px; text-align: center; }
.custom-bg { --background: #f5f5f5; }

.cart-container {
  display: flex; flex-direction: column; align-items: center; justify-content: center; height: 80vh; padding: 20px;
}

.empty-state { text-align: center; color: #888; }
.empty-icon { font-size: 80px; color: #ccc; margin-bottom: 10px; }
.empty-state h2 { font-family: 'Joan', serif; color: #333; margin: 0 0 10px 0; }
.empty-state p { font-family: 'Inter', sans-serif; font-size: 14px; line-height: 1.5; margin-bottom: 25px; }

.active-cart-state { width: 100%; max-width: 400px; }
.preview-card {
  background: white; border-radius: 20px; padding: 25px 20px;
  box-shadow: 0px 5px 20px rgba(0,0,0,0.08); text-align: center;
}
.preview-header { display: flex; align-items: center; justify-content: center; gap: 10px; color: #9A4444; margin-bottom: 15px; }
.preview-header ion-icon { font-size: 28px; }
.preview-header h3 { font-family: 'Joan', serif; margin: 0; font-size: 20px; font-weight: bold; }

.preview-body p { font-family: 'Inter', sans-serif; font-size: 16px; color: #555; margin: 10px 0; }
.preview-body strong { color: #000; font-size: 18px; }

.action-btn {
  background: #9A4444; color: white; padding: 12px 30px; border-radius: 30px;
  font-family: 'Inter', sans-serif; font-size: 16px; font-weight: bold; border: none; cursor: pointer; margin-top: 10px;
}
.checkout-btn { width: 100%; margin-top: 25px; padding: 15px; font-size: 18px; }
.action-btn:active { transform: scale(0.98); }
</style>