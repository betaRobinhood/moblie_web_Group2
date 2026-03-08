<template>
  <ion-page v-if="restaurant">
    <ion-header class="ion-no-border">
      <ion-toolbar class="custom-toolbar">
        <ion-buttons slot="start">
          <ion-back-button default-href="/staff/dashboard" color="light"></ion-back-button>
        </ion-buttons>
        <ion-title class="header-title">ตั้งค่าร้านอาหาร</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="saveChanges" :disabled="saving" class="save-btn">
            <ion-spinner v-if="saving" name="crescent" class="btn-spinner"></ion-spinner>
            <span v-else>บันทึก</span>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    
    <ion-content :fullscreen="true" class="custom-bg">
      <div class="content-wrapper">
        
        <div class="header-image-edit" @click="triggerImageUpload">
          <img :src="restaurant.coverImageUrl || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80'" />
          <div class="overlay">
            <ion-icon :icon="cameraOutline" class="camera-icon"></ion-icon>
            <p>แตะเพื่อเปลี่ยนรูปหน้าปก</p>
          </div>
          <input type="file" ref="fileInput" style="display: none" @change="handleImageChange" accept="image/*" />
        </div>

        <div class="form-card">
          <h2 class="section-title">ข้อมูลพื้นฐาน</h2>

          <div class="input-group">
            <label class="input-label">ชื่อร้านอาหาร (EN)</label>
            <input type="text" v-model="restaurant.name.en" class="custom-input" placeholder="Enter restaurant name" />
          </div>

          <div class="input-group">
            <label class="input-label">ชื่อร้านอาหาร (TH)</label>
            <input type="text" v-model="restaurant.name.th" class="custom-input" placeholder="กรอกชื่อร้านอาหาร" />
          </div>

          <div class="input-group">
            <label class="input-label">รายละเอียดร้าน (EN)</label>
            <textarea v-model="restaurant.description.en" class="custom-input custom-textarea" rows="3" placeholder="Enter description"></textarea>
          </div>

          <div class="input-group">
            <label class="input-label">รายละเอียดร้าน (TH)</label>
            <textarea v-model="restaurant.description.th" class="custom-input custom-textarea" rows="3" placeholder="กรอกรายละเอียดร้าน"></textarea>
          </div>

          <div class="input-group">
            <label class="input-label">สถานที่ตั้ง (Location)</label>
            <input type="text" v-model="restaurant.location" class="custom-input" placeholder="ระบุตำแหน่งที่ตั้ง" />
          </div>

          <div class="input-group">
            <label class="input-label">เวลาเปิด-ปิด (Opening Hours)</label>
            <input type="text" v-model="restaurant.openingHours" class="custom-input" placeholder="เช่น 10:00 - 22:00" />
          </div>

          <div class="input-group">
            <label class="input-label">เวลาทานเฉลี่ยต่อโต๊ะ (นาที)</label>
            <input type="number" :value="restaurant.avgDiningTime" @input="restaurant.avgDiningTime = Number(($event.target as any).value)" class="custom-input" />
          </div>

          <div class="toggle-group">
            <div class="toggle-text">
              <label class="input-label" style="margin: 0;">เปิดรับคิว (Queue Status)</label>
              <p class="helper-text">เปิดเพื่อให้ลูกค้าสามารถกดจองคิวผ่านแอปได้</p>
            </div>
            <ion-toggle v-model="restaurant.queueEnabled" color="success" class="custom-toggle"></ion-toggle>
          </div>
        </div>

        <div class="management-card">
          <h2 class="section-title">จัดการข้อมูลอื่นๆ</h2>
          <div class="action-grid">
            <button class="manage-btn tables-btn" @click="router.push('/staff/tables')">
              <ion-icon :icon="gridOutline" class="manage-icon"></ion-icon>
              <span>จัดการโต๊ะอาหาร</span>
            </button>
            <button class="manage-btn menu-btn" @click="router.push('/staff/menu')">
              <ion-icon :icon="fastFoodOutline" class="manage-icon"></ion-icon>
              <span>จัดการเมนูอาหาร</span>
            </button>
          </div>
        </div>

      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { 
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, 
  IonBackButton, IonButtons, IonButton, IonToggle, IonSpinner, IonIcon, toastController
} from '@ionic/vue';
import { cameraOutline, gridOutline, fastFoodOutline } from 'ionicons/icons';
import { useRouter } from 'vue-router';
import { db } from '../../services/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { uploadToCloudinary } from '../../services/cloudinary';
import type { Restaurant } from '../../models/types';
import { useUserStore } from '../../stores/userStore';

const router = useRouter();
const restaurant = ref<Restaurant | null>(null);
const fileInput = ref<HTMLInputElement | null>(null);
const saving = ref(false);
const userStore = useUserStore();
const restaurantId = computed(() => userStore.profile?.restaurantId || 'DEMO_REST_ID');

onMounted(async () => {
  if (restaurantId.value) {
    const docRef = doc(db, 'restaurants', restaurantId.value);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      restaurant.value = { id: docSnap.id, ...docSnap.data() } as Restaurant;
    }
  }
});

const triggerImageUpload = () => {
  fileInput.value?.click();
};

const handleImageChange = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (target.files?.length && restaurant.value) {
    try {
      saving.value = true;
      const res = await uploadToCloudinary(target.files[0], 'restaurants');
      restaurant.value.coverImageUrl = res.secure_url;
      
      const toast = await toastController.create({
        message: 'อัปโหลดรูปภาพสำเร็จ',
        duration: 1500,
        color: 'success',
        position: 'bottom'
      });
      await toast.present();
    } catch (e) {
      console.error(e);
      const toast = await toastController.create({
        message: 'อัปโหลดรูปภาพล้มเหลว กรุณาลองใหม่',
        duration: 2000,
        color: 'danger',
        position: 'bottom'
      });
      await toast.present();
    } finally {
      saving.value = false;
    }
  }
};

const saveChanges = async () => {
  if (!restaurant.value) return;
  saving.value = true;
  try {
    const { id, ...data } = restaurant.value;
    await updateDoc(doc(db, 'restaurants', id), data);
    
    const toast = await toastController.create({
      message: 'บันทึกข้อมูลเรียบร้อยแล้ว',
      duration: 2000,
      color: 'success',
      position: 'bottom'
    });
    await toast.present();
  } catch (e) {
    console.error(e);
    const toast = await toastController.create({
      message: 'บันทึกข้อมูลล้มเหลว กรุณาลองใหม่',
      duration: 2000,
      color: 'danger',
      position: 'bottom'
    });
    await toast.present();
  } finally {
    saving.value = false;
  }
};
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Joan&display=swap');

/* ================== Header & Toolbar ================== */
.custom-toolbar {
  --background: #9A4444;
  --color: white;
  padding: 5px 0;
}
.header-title {
  font-family: 'Joan', serif;
  font-size: 22px;
  letter-spacing: 0.5px;
  text-align: center;
}
.save-btn {
  font-family: 'Inter', sans-serif;
  font-weight: 600;
  --color: #FFFFFF;
}
.btn-spinner {
  color: white;
}

/* ================== Background ================== */
.custom-bg {
  --background: #f5f5f5;
}
.content-wrapper {
  padding: 15px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* ================== Cover Image ================== */
.header-image-edit {
  position: relative;
  width: 100%;
  height: 220px;
  border-radius: 15px;
  overflow: hidden;
  cursor: pointer;
  box-shadow: 0 4px 15px rgba(0,0,0,0.1);
  background: #eee;
}
.header-image-edit img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}
.overlay {
  position: absolute;
  top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(0,0,0,0.5);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: white;
  opacity: 0;
  transition: opacity 0.3s ease;
}
.header-image-edit:hover .overlay {
  opacity: 1;
}
.header-image-edit:hover img {
  transform: scale(1.05);
}
.camera-icon {
  font-size: 48px;
  margin-bottom: 10px;
}
.overlay p {
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  margin: 0;
}

/* ================== Form Cards ================== */
.form-card, .management-card {
  background: #FFFFFF;
  border-radius: 20px;
  padding: 20px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.05);
}
.section-title {
  font-family: 'Joan', serif;
  font-size: 20px;
  font-weight: bold;
  color: #333;
  margin: 0 0 20px 0;
  border-bottom: 2px solid #f0f0f0;
  padding-bottom: 10px;
}

/* ================== Inputs ================== */
.input-group {
  display: flex;
  flex-direction: column;
  margin-bottom: 15px;
}
.input-label {
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  font-weight: 600;
  color: #666;
  margin-bottom: 8px;
}
.custom-input {
  width: 100%;
  padding: 12px 15px;
  background: #f9f9f9;
  border: 1.5px solid #e0e0e0;
  border-radius: 10px;
  font-family: 'Inter', sans-serif;
  font-size: 15px;
  color: #333;
  outline: none;
  transition: border-color 0.2s;
}
.custom-input:focus {
  border-color: #9A4444;
  background: #ffffff;
}
.custom-textarea {
  resize: vertical;
  min-height: 80px;
}

/* ================== Toggle (เปิด-ปิดคิว) ================== */
.toggle-group {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #fdf2f0;
  padding: 15px;
  border-radius: 12px;
  border: 1px solid #fadbd8;
  margin-top: 10px;
}
.toggle-text {
  display: flex;
  flex-direction: column;
}
.helper-text {
  font-family: 'Inter', sans-serif;
  font-size: 11px;
  color: #888;
  margin: 4px 0 0 0;
}
.custom-toggle {
  --background-checked: #2ecc71;
}

/* ================== Management Buttons ================== */
.action-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
}
.manage-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 20px 10px;
  border-radius: 15px;
  border: none;
  cursor: pointer;
  transition: transform 0.1s, box-shadow 0.1s;
}
.manage-btn:active {
  transform: scale(0.95);
}
.manage-icon {
  font-size: 32px;
}
.manage-btn span {
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  font-weight: 600;
}

/* สีปุ่มจัดการโต๊ะ */
.tables-btn {
  background: #e8f8f5;
  color: #1abc9c;
  border: 1px solid #d1f2eb;
}
.tables-btn .manage-icon { color: #16a085; }

/* สีปุ่มจัดการเมนู */
.menu-btn {
  background: #fef9e7;
  color: #f39c12;
  border: 1px solid #fcf3cf;
}
.menu-btn .manage-icon { color: #e67e22; }
</style>