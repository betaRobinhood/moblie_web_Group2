<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/home"></ion-back-button>
        </ion-buttons>
        <ion-title>Your Cart</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <div v-if="cartStore.items.length === 0" class="ion-padding ion-text-center empty-state">
        <ion-icon :icon="cartOutline" size="large" color="medium"></ion-icon>
        <h3>Your cart is empty</h3>
        <ion-button router-link="/home" fill="outline">Browse Restaurants</ion-button>
      </div>

      <template v-else>
        <ion-list>
          <ion-item-sliding v-for="item in cartStore.items" :key="item.menuItemId">
            <ion-item>
              <ion-label>
                <h2>{{ item.name[locale.value] || item.name['en'] }}</h2>
                <p>฿{{ item.price }} × {{ item.quantity }}</p>
              </ion-label>
              <div slot="end" class="qty-control">
                <ion-button fill="clear" size="small" @click="decreaseQty(item.menuItemId)">
                  <ion-icon :icon="removeCircleOutline"></ion-icon>
                </ion-button>
                <span>{{ item.quantity }}</span>
                <ion-button fill="clear" size="small" @click="increaseQty(item.menuItemId)">
                  <ion-icon :icon="addCircleOutline"></ion-icon>
                </ion-button>
              </div>
              <ion-note slot="end">฿{{ item.price * item.quantity }}</ion-note>
            </ion-item>
            <ion-item-options side="end">
              <ion-item-option color="danger" @click="removeItem(item.menuItemId)">
                <ion-icon :icon="trashOutline" slot="icon-only"></ion-icon>
              </ion-item-option>
            </ion-item-options>
          </ion-item-sliding>
        </ion-list>

        <ion-item lines="none" class="total-row ion-margin-top">
          <ion-label><strong>Total</strong></ion-label>
          <ion-note slot="end" class="total-price">฿{{ cartStore.totalPrice }}</ion-note>
        </ion-item>

        <div class="ion-padding">
          <ion-button expand="block" :disabled="loading" @click="submitOrder" color="primary">
            <ion-spinner v-if="loading" name="crescent"></ion-spinner>
            <span v-else>Submit Order</span>
          </ion-button>
          <ion-button expand="block" fill="outline" color="medium" class="ion-margin-top" @click="cartStore.clearCart()">
            Clear Cart
          </ion-button>
        </div>
      </template>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonBackButton, IonButtons, IonList, IonItem, IonLabel,
  IonButton, IonSpinner, IonIcon, IonNote,
  IonItemSliding, IonItemOptions, IonItemOption,
  toastController
} from '@ionic/vue';
import { cartOutline, removeCircleOutline, addCircleOutline, trashOutline } from 'ionicons/icons';
import { useCartStore } from '../../stores/cartStore';
import { useUserStore } from '../../stores/userStore';
import { useQueueStore } from '../../stores/queueStore';
import { useI18n } from 'vue-i18n';
import { db } from '../../services/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useRouter } from 'vue-router';

const cartStore = useCartStore();
const userStore = useUserStore();
const queueStore = useQueueStore();
const router = useRouter();
const { locale } = useI18n() as { locale: { value: 'en' | 'th' } };
const loading = ref(false);

const increaseQty = (id: string) => {
  const item = cartStore.items.find(i => i.menuItemId === id);
  if (item) item.quantity++;
};

const decreaseQty = (id: string) => {
  const item = cartStore.items.find(i => i.menuItemId === id);
  if (item) {
    if (item.quantity <= 1) removeItem(id);
    else item.quantity--;
  }
};

const removeItem = (id: string) => {
  const idx = cartStore.items.findIndex(i => i.menuItemId === id);
  if (idx !== -1) cartStore.items.splice(idx, 1);
};

const submitOrder = async () => {
  if (!userStore.user) return;
  loading.value = true;
  try {
    await addDoc(collection(db, 'orders'), {
      userId: userStore.user.uid,
      restaurantId: cartStore.restaurantId,
      tableId: cartStore.tableId ?? queueStore.activeQueue?.restaurantId ?? null,
      items: cartStore.items,
      totalPrice: cartStore.totalPrice,
      status: 'preparing',
      createdAt: serverTimestamp()
    });
    cartStore.clearCart();
    const toast = await toastController.create({
      message: 'Order submitted! Staff will prepare your food.',
      duration: 2500,
      color: 'success',
      position: 'bottom'
    });
    await toast.present();
    router.push('/my-queue');
  } catch (error) {
    console.error(error);
    const toast = await toastController.create({
      message: 'Failed to submit order. Please try again.',
      duration: 2500,
      color: 'danger',
      position: 'bottom'
    });
    await toast.present();
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.empty-state {
  margin-top: 5rem;
}
.qty-control {
  display: flex;
  align-items: center;
  gap: 4px;
}
.total-row {
  border-top: 1px solid var(--ion-color-light);
  padding-top: 0.5rem;
}
.total-price {
  font-size: 1.2rem;
  font-weight: bold;
  color: var(--ion-color-primary);
}
</style>
