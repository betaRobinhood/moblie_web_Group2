<template>
  <ion-page>
    <ion-content :fullscreen="true" class="custom-bg">
      <div class="header-gradient"></div>

      <div class="checkout-card">
        
        <div class="card-header">
          <ion-icon :icon="arrowBackCircleOutline" class="back-btn" @click="router.back()"></ion-icon>
          <h2 class="title">สรุปคำสั่งซื้อ</h2>
        </div>

        <div v-if="cartStore.items.length === 0" class="empty-cart">
          <p>ไม่มีรายการอาหารในตะกร้า</p>
        </div>

        <div v-else class="cart-content">
          <div class="item-list">
            <div class="cart-item" v-for="item in cartStore.items" :key="item.menuItemId">
              <div class="item-img">
            <!-- item.imageUrl ||  -->
                <img :src="'https://placehold.co/100x100/f4f5f8/999?text=Food'" />
              </div>
              <div class="item-details">
                <h3 class="item-name">{{ item.name[locale?.value || 'en'] || item.name['en'] }}</h3>
                <p class="item-note">ไม่ใส่พริก ไม่เอาไก่ (ตัวอย่าง Note)</p>
                <p class="item-price">{{ item.price }} THB</p>
              </div>
              <div class="item-actions">
                <ion-icon :icon="trashOutline" class="trash-icon" @click="removeItem(item.menuItemId)"></ion-icon>
                <span class="item-qty">x{{ item.quantity }}</span>
              </div>
            </div>
          </div>

          <div class="checkout-footer">
            <div class="summary-row total-row">
              <span class="summary-label">TOTAL</span>
              <span class="summary-value total-price">{{ cartStore.totalPrice }} THB</span>
            </div>
            
            <button class="confirm-btn" @click="confirmOrder" :disabled="isConfirming">
              <ion-spinner v-if="isConfirming" name="crescent"></ion-spinner>
              <span v-else>ยืนยันคำสั่งซื้อ</span>
            </button>
          </div>
        </div>

      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { IonPage, IonContent, IonIcon, IonSpinner, toastController } from '@ionic/vue';
import { arrowBackCircleOutline, trashOutline } from 'ionicons/icons';
import { useRouter, useRoute } from 'vue-router';
import { useCartStore } from '../../stores/cartStore';
import { useQueueStore } from '../../stores/queueStore';
import { useUserStore } from '../../stores/userStore';
import { useOrderStore } from '../../stores/orderStore';
import { useI18n } from 'vue-i18n';

const router = useRouter();
const route = useRoute();
const cartStore = useCartStore();
const queueStore = useQueueStore();
const userStore = useUserStore();
const orderStore = useOrderStore();

const i18n = useI18n();
const locale = i18n?.locale as { value: 'en' | 'th' } | undefined;

const isConfirming = ref(false);

const removeItem = (id: string) => {
  cartStore.removeFromCart(id);
};

const confirmOrder = async () => {
  if (!userStore.user) {
    alert("กรุณาล็อกอินก่อนทำรายการ");
    return;
  }

  if (!queueStore.activeQueue || !queueStore.activeQueue.tableId) {
    alert("ขออภัย ไม่พบมูลโต๊ะของคุณ กรุณาติดต่อพนักงาน");
    return;
  }

  isConfirming.value = true;
  const restaurantId = route.params.id as string;

  try {
    // 1. ส่งออเดอร์เข้า Firebase
    const result = await orderStore.placeOrder(
      restaurantId, 
      userStore.user.uid, 
      queueStore.activeQueue.tableId,
      queueStore.activeQueue.tableNumber || 0,
      cartStore.items,
      cartStore.totalPrice
    );
    
    if (result.success) {
      cartStore.clearCart(); 
      router.push(`/restaurant/${restaurantId}/order-status`); 
      
      const toast = await toastController.create({
        message: 'สั่งอาหารสำเร็จ! ห้องครัวกำลังเตรียมอาหารให้คุณครับ',
        duration: 2500,
        color: 'success',
        position: 'top'
      });
      await toast.present();
    } else {
      throw new Error("Failed to place order");
    }
  } catch (error) {
    console.error("Error placing order", error);
    alert("เกิดข้อผิดพลาดในการทำรายการ กรุณาลองใหม่อีกครั้ง");
  } finally {
    isConfirming.value = false;
  }
};
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600&family=Joan&display=swap');

.custom-bg { --background: #f5f5f5; }

.header-gradient { position: absolute; top: 0; left: 0; width: 100%; height: 200px; background: linear-gradient(180deg, #9A4444 26%, #AD523F 46%, #C86637 68.17%, #DD7631 100%); z-index: 1; }

.checkout-card { position: relative; background: #FFFFFF; border-radius: 30px; margin: 60px 15px 20px 15px; min-height: 80vh; z-index: 2; box-shadow: 0px 4px 15px rgba(0,0,0,0.1); display: flex; flex-direction: column; }

.card-header { display: flex; align-items: center; padding: 25px 20px 15px 20px; border-bottom: 1px solid #eee; }
.back-btn { font-size: 32px; color: #9A4444; cursor: pointer; }
.title { width: 100%; text-align: center; margin: 0; padding-right: 32px; font-family: 'Joan', serif; font-size: 22px; font-weight: bold; }

.empty-cart { padding: 40px 20px; text-align: center; color: #888; }

.cart-content { display: flex; flex-direction: column; flex: 1; padding: 15px 20px; }

.item-list { flex: 1; display: flex; flex-direction: column; gap: 15px; }
.cart-item { display: flex; gap: 12px; border-bottom: 1px solid #f0f0f0; padding-bottom: 15px; }
.item-img { width: 80px; height: 70px; border-radius: 8px; overflow: hidden; flex-shrink: 0; }
.item-img img { width: 100%; height: 100%; object-fit: cover; }

.item-details { flex: 1; display: flex; flex-direction: column; justify-content: center; }
.item-name { margin: 0; font-family: 'Joan', serif; font-size: 15px; font-weight: bold; color: #000; }
.item-note { margin: 3px 0 0 0; font-family: 'Joan', serif; font-size: 11px; color: #999; }
.item-price { margin: auto 0 0 0; font-family: 'Inter', sans-serif; font-size: 14px; color: #888; }

.item-actions { display: flex; flex-direction: column; justify-content: space-between; align-items: flex-end; }
.trash-icon { font-size: 20px; color: #000; cursor: pointer; }
.item-qty { font-family: 'Inter', sans-serif; font-size: 14px; color: #000; }

.checkout-footer { margin-top: 20px; padding-top: 20px; border-top: 2px solid #eee; }
.summary-row { display: flex; justify-content: space-between; font-family: 'Joan', serif; margin-bottom: 10px; }
.summary-label { font-size: 16px; color: #000; }
.summary-value { font-size: 18px; color: #000; }
.total-row { margin-bottom: 25px; }
.total-price { font-size: 20px; font-weight: bold; }

.confirm-btn { background: #9A4444; color: #FFF; font-family: 'Joan', serif; font-size: 20px; width: 100%; height: 50px; border-radius: 30px; border: none; cursor: pointer; box-shadow: 0px 4px 10px rgba(154, 68, 68, 0.3); transition: transform 0.1s; display: flex; justify-content: center; align-items: center; }
.confirm-btn:active { transform: scale(0.98); }
</style>