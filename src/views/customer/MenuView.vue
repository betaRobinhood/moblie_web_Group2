<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button :default-href="`/restaurant/${restaurantId}`"></ion-back-button>
        </ion-buttons>
        <ion-title>Menu</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="viewCart">
            <ion-icon :icon="cartOutline"></ion-icon>
            <ion-badge v-if="cartStore.itemCount > 0" color="danger">{{ cartStore.itemCount }}</ion-badge>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <div v-if="loadingMenu" class="ion-padding ion-text-center">
        <ion-spinner name="crescent"></ion-spinner>
      </div>

      <div v-else-if="menuItems.length === 0" class="ion-padding ion-text-center">
        <p>No menu items available.</p>
      </div>

      <ion-list v-else>
        <ion-item v-for="item in menuItems" :key="item.id">
          <ion-thumbnail slot="start">
            <img :src="item.imageUrl || 'https://placehold.co/80x80/f4f5f8/999?text=Food'" />
          </ion-thumbnail>
          <ion-label>
            <h2>{{ item.name[locale.value] || item.name['en'] }}</h2>
            <p>{{ item.description[locale.value] || item.description['en'] }}</p>
            <p><strong>฿{{ item.price }}</strong></p>
          </ion-label>
          <ion-button slot="end" fill="clear" @click="addItem(item)">
            <ion-icon :icon="addCircleOutline"></ion-icon>
          </ion-button>
        </ion-item>
      </ion-list>

      <!-- Cart FAB -->
      <ion-fab v-if="cartStore.itemCount > 0" vertical="bottom" horizontal="end" slot="fixed">
        <ion-fab-button @click="viewCart" color="primary">
          <ion-icon :icon="cartOutline"></ion-icon>
        </ion-fab-button>
      </ion-fab>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonBackButton, IonButtons, IonIcon, IonItem, IonLabel,
  IonThumbnail, IonButton, IonBadge, IonList, IonSpinner,
  IonFab, IonFabButton
} from '@ionic/vue';
import { cartOutline, addCircleOutline } from 'ionicons/icons';
import { useRoute, useRouter } from 'vue-router';
import { db } from '../../services/firebase';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { useCartStore } from '../../stores/cartStore';
import { useI18n } from 'vue-i18n';
import type { MenuItem } from '../../models/types';
import { toastController } from '@ionic/vue';

const route = useRoute();
const router = useRouter();
const cartStore = useCartStore();
const { locale } = useI18n() as { locale: { value: 'en' | 'th' } };
const menuItems = ref<MenuItem[]>([]);
const loadingMenu = ref(true);
const restaurantId = route.params.id as string;

onMounted(async () => {
  try {
    const q = query(
      collection(db, `restaurants/${restaurantId}/menus`),
      orderBy('category')
    );
    const snapshot = await getDocs(q);
    menuItems.value = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MenuItem));
    // Set restaurantId in cart store so order knows which restaurant
    cartStore.restaurantId = restaurantId;
  } finally {
    loadingMenu.value = false;
  }
});

const addItem = async (item: MenuItem) => {
  cartStore.addToCart({
    menuItemId: item.id,
    name: item.name,
    price: item.price,
    quantity: 1
  });
  const toast = await toastController.create({
    message: `Added: ${item.name[locale.value] || item.name['en']}`,
    duration: 1000,
    position: 'bottom',
    color: 'success'
  });
  await toast.present();
};

const viewCart = () => {
  router.push('/cart');
};
</script>
