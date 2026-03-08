<template>
  <ion-page>
    <ion-content :fullscreen="true" class="custom-bg">
      
      <div class="header-bg">
        <div class="top-nav">
          <ion-icon :icon="arrowBackOutline" class="nav-icon" @click="goBack"></ion-icon>
          
          <div class="cart-wrapper" @click="viewCart">
            <ion-icon :icon="cartOutline" class="nav-icon"></ion-icon>
            <span v-if="cartStore.itemCount > 0" class="cart-badge">{{ cartStore.itemCount }}</span>
          </div>
        </div>
        <h1 class="greeting-text">Hello {{ userStore.profile?.username || userStore.profile?.firstName || 'User' }}</h1>
      </div>

      <div class="main-content">
        <div v-if="loadingMenu" class="ion-text-center ion-padding" style="margin-top: 50px;">
          <ion-spinner name="crescent" color="primary"></ion-spinner>
        </div>
        
        <template v-else>
          <img class="hero-image" :src="restaurant?.coverImageUrl || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80'" />

          <h2 class="section-title">เมนูแนะนำ</h2>
          <div class="horizontal-scroll">
            <div class="h-card" v-for="item in recommendedItems" :key="'rec-'+item.id" @click="addItem(item)">
              <img :src="item.imageUrl || 'https://placehold.co/161x126/f4f5f8/999?text=Recommended'" />
            </div>
          </div>

          <div class="divider"></div>

          <h2 class="section-title">รายการสินค้า</h2>
          <div v-if="menuItems.length === 0" class="ion-text-center" style="color: #888; padding: 20px;">
            <p>No menu items available.</p>
          </div>

          <div class="vertical-list" v-else>
            <div class="v-card" v-for="item in menuItems" :key="item.id" @click="addItem(item)">
              <div class="v-card-img-wrapper">
                <img class="v-card-img" :src="item.imageUrl || 'https://placehold.co/151x120/f4f5f8/999?text=Food'" />
              </div>
              
              <div class="v-card-info">
                <h3 class="item-name">{{ item.name[locale?.value || 'en'] || item.name['en'] }}</h3>
                <p class="item-desc">{{ item.description[locale?.value || 'en'] || item.description['en'] }}</p>
                
                <div class="price-row">
                  <span class="item-price">{{ item.price }} THB</span>
                  <button class="add-btn" @click.stop="addItem(item)">
                    <ion-icon :icon="addOutline"></ion-icon>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </template>
      </div>

    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { IonPage, IonContent, IonIcon, IonSpinner, toastController } from '@ionic/vue';
import { cartOutline, arrowBackOutline, addOutline } from 'ionicons/icons';
import { useRoute, useRouter } from 'vue-router';
import { db } from '../../services/firebase';
import { collection, getDocs, doc, getDoc, orderBy, query } from 'firebase/firestore';
import { useCartStore } from '../../stores/cartStore';
import { useUserStore } from '../../stores/userStore';
import { useI18n } from 'vue-i18n';
import type { MenuItem, Restaurant } from '../../models/types';

const route = useRoute();
const router = useRouter();
const cartStore = useCartStore();
const userStore = useUserStore();

const i18n = useI18n();
const locale = i18n?.locale as { value: 'en' | 'th' } | undefined;

const restaurantId = route.params.id as string;
const restaurant = ref<Restaurant | null>(null);
const menuItems = ref<MenuItem[]>([]);
const loadingMenu = ref(true);

// ดึง 3 เมนูแรกมาโชว์ใน "เมนูแนะนำ"
const recommendedItems = computed(() => {
  return menuItems.value.slice(0, 3);
});

onMounted(async () => {
  try {
    // 1. ดึงข้อมูลร้านอาหาร (เพื่อเอารูป Cover ร้านมาโชว์ด้านบน)
    const restSnap = await getDoc(doc(db, 'restaurants', restaurantId));
    if (restSnap.exists()) {
      restaurant.value = { id: restSnap.id, ...restSnap.data() } as Restaurant;
    }

    // 2. ดึงข้อมูลเมนูอาหารทั้งหมด
    const q = query(
      collection(db, `restaurants/${restaurantId}/menus`),
      orderBy('category')
    );
    const snapshot = await getDocs(q);
    menuItems.value = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MenuItem));
    
    // ตั้งค่า restaurantId ให้ตะกร้า เพื่อให้รู้ว่าสั่งของร้านไหนอยู่
    cartStore.restaurantId = restaurantId;
  } finally {
    loadingMenu.value = false;
  }
});

const goBack = () => {
  router.push(`/restaurant/${restaurantId}`);
};

const viewCart = () => {
  // กดตะกร้าแล้ววิ่งไปที่หน้า "สรุปคำสั่งซื้อ" (ที่เราเพิ่งสร้าง)
  router.push(`/restaurant/${restaurantId}/cart`);
};

const addItem = async (item: MenuItem) => {
  cartStore.addToCart({
    menuItemId: item.id,
    name: item.name,
    price: item.price,
    quantity: 1
  });
  
  const toast = await toastController.create({
    message: `เพิ่ม ${item.name[locale?.value || 'en'] || item.name['en']} ลงตะกร้าแล้ว`,
    duration: 1000,
    position: 'bottom',
    color: 'success',
    cssClass: 'custom-toast'
  });
  await toast.present();
};
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600&family=Joan&display=swap');

.custom-bg {
  --background: #fdfdfd;
}

/* ================= Header ไล่สี ================= */
.header-bg {
  position: relative;
  width: 100%;
  height: 180px;
  background: linear-gradient(180deg, #9A4444 26%, #AD523F 46%, #C86637 68.17%, #DD7631 100%);
  border-bottom-left-radius: 30px;
  border-bottom-right-radius: 30px;
  padding: 40px 20px 0 20px;
  z-index: 1;
}

.top-nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.nav-icon {
  font-size: 32px;
  color: #FFFFFF;
  cursor: pointer;
}

.cart-wrapper {
  position: relative;
}

.cart-badge {
  position: absolute;
  top: -5px;
  right: -5px;
  background: #000;
  color: #FFF;
  font-size: 12px;
  font-weight: bold;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.greeting-text {
  font-family: 'Joan', serif;
  font-size: 32px;
  color: #FFFFFF;
  margin-top: 15px;
  font-weight: 400;
}

/* ================= เนื้อหาหลัก ================= */
.main-content {
  padding: 0 16px 30px 16px;
  margin-top: -30px; /* ดึงเนื้อหาขึ้นไปซ้อนทับ Header สีส้ม */
  position: relative;
  z-index: 2;
}

.hero-image {
  width: 100%;
  height: 200px;
  object-fit: cover;
  border-radius: 10px;
  box-shadow: 0px 5px 15px rgba(0,0,0,0.15);
  margin-bottom: 25px;
  background-color: #eee;
}

.section-title {
  font-family: 'Joan', serif;
  font-size: 20px;
  color: #000000;
  margin: 0 0 15px 5px;
}

/* ================= เมนูแนะนำ ================= */
.horizontal-scroll {
  display: flex;
  gap: 15px;
  overflow-x: auto;
  padding-bottom: 15px;
  /* ซ่อน Scrollbar สำหรับ Browser ต่างๆ */
  scrollbar-width: none; 
  -ms-overflow-style: none;
}
.horizontal-scroll::-webkit-scrollbar {
  display: none;
}

.h-card {
  width: 161px;
  height: 126px;
  flex-shrink: 0;
  border-radius: 5px;
  overflow: hidden;
  box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.1);
  cursor: pointer;
}
.h-card img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.divider {
  width: 104px;
  height: 5px;
  background: #D9D9D9;
  border-radius: 30px;
  margin: 10px 5px 20px 5px;
}

/* ================= รายการสินค้า ================= */
.vertical-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.v-card {
  width: 100%;
  height: 120px;
  background: #FFFFFF;
  border: 1px solid rgba(0, 0, 0, 0.1);
  box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.05);
  border-radius: 5px;
  display: flex;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s;
}
.v-card:active {
  transform: scale(0.98);
}

.v-card-img-wrapper {
  width: 151px;
  height: 120px;
  flex-shrink: 0;
}
.v-card-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.v-card-info {
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  width: 100%;
}

.item-name {
  font-family: 'Joan', serif;
  font-size: 16px;
  color: #000000;
  margin: 0;
  line-height: 1.2;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.item-desc {
  font-family: 'Joan', serif;
  font-size: 12px;
  color: rgba(0, 0, 0, 0.5);
  margin: 5px 0 0 0;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.price-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: auto;
}

.item-price {
  font-family: 'Inter', sans-serif;
  font-size: 16px;
  color: #9A4444;
  font-weight: 500;
}

.add-btn {
  background: transparent;
  color: #9A4444;
  border: none;
  font-size: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 0;
}
</style>