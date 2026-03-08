<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar class="custom-toolbar">
        <ion-buttons slot="start">
          <ion-back-button default-href="/staff/management" color="light"></ion-back-button>
        </ion-buttons>
        <ion-title class="header-title">จัดการเมนูอาหาร</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="custom-bg">
      <div class="content-wrapper">
        
        <div v-if="loadingMenu" class="empty-state">
          <ion-spinner name="crescent" class="custom-spinner"></ion-spinner>
          <p style="margin-top: 15px; color: #888;">กำลังโหลดเมนูอาหาร...</p>
        </div>

        <div v-else-if="menuItems.length === 0" class="empty-state">
          <ion-icon :icon="fastFoodOutline" class="empty-icon"></ion-icon>
          <h3>ยังไม่มีรายการอาหาร</h3>
          <p>กดปุ่ม + ด้านล่างเพื่อเพิ่มเมนูใหม่</p>
        </div>

        <div class="menu-list-container" v-else>
          <div v-for="item in menuItems" :key="item.id" class="menu-card">
            
            <div class="menu-img-wrapper">
              <img :src="item.imageUrl || 'https://placehold.co/150x150/f4f5f8/999?text=Food'" class="menu-img" />
            </div>
            
            <div class="menu-info">
              <h3 class="menu-name">{{ item.name.th || item.name.en }}</h3>
              <p class="menu-category">{{ item.category || 'General' }}</p>
              <div class="menu-bottom-row">
                <span class="menu-price">{{ item.price }} THB</span>
                
                <div class="menu-actions">
                  <button class="action-icon-btn edit-btn" @click="editItem(item)">
                    <ion-icon :icon="createOutline"></ion-icon>
                  </button>
                  <button class="action-icon-btn delete-btn" @click="deleteItem(item.id)">
                    <ion-icon :icon="trashOutline"></ion-icon>
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>

      <ion-fab vertical="bottom" horizontal="end" slot="fixed">
        <ion-fab-button @click="openAddModal" class="custom-fab-add">
          <ion-icon :icon="addOutline"></ion-icon>
        </ion-fab-button>
      </ion-fab>

      <ion-modal :is-open="showModal" @didDismiss="showModal = false" class="custom-modal">
        <div class="modal-content">
          <div class="modal-header">
            <h2 class="modal-title">{{ editingItem ? 'แก้ไขเมนู' : 'เพิ่มเมนูใหม่' }}</h2>
            <ion-icon :icon="closeOutline" class="close-icon" @click="showModal = false"></ion-icon>
          </div>

          <div class="form-scroll-area">
            
            <div class="menu-image-edit" @click="triggerFileUpload">
              <img :src="form.imageUrl || 'https://placehold.co/300x300/f4f5f8/999?text=Tap+to+add+image'" />
              <div class="overlay">
                <ion-icon :icon="cameraOutline" class="camera-icon"></ion-icon>
                <span>เปลี่ยนรูปภาพ</span>
              </div>
              <input type="file" ref="menuFileInput" style="display: none" @change="handleFileUpload" accept="image/*" />
            </div>

            <div class="add-form">
              <div class="input-group">
                <label class="input-label">ชื่อเมนูอาหาร (TH)</label>
                <input type="text" v-model="form.name.th" class="custom-input" placeholder="กรอกชื่อเมนู (ภาษาไทย)" />
              </div>

              <div class="input-group">
                <label class="input-label">ชื่อเมนูอาหาร (EN)</label>
                <input type="text" v-model="form.name.en" class="custom-input" placeholder="กรอกชื่อเมนู (English)" />
              </div>

              <div class="input-row">
                <div class="input-group half-width">
                  <label class="input-label">ราคา (THB)</label>
                  <input type="number" v-model.number="form.price" class="custom-input" placeholder="0" />
                </div>
                <div class="input-group half-width">
                  <label class="input-label">หมวดหมู่</label>
                  <input type="text" v-model="form.category" class="custom-input" placeholder="เช่น อาหารจานหลัก, เครื่องดื่ม" />
                </div>
              </div>

              <div class="input-group">
                <label class="input-label">คำอธิบาย (Optional)</label>
                <textarea v-model="form.description.th" class="custom-input custom-textarea" rows="2" placeholder="ใส่คำอธิบายเพิ่มเติม..."></textarea>
              </div>

              <button class="save-action-btn" @click="saveItem" :disabled="saving">
                <ion-spinner v-if="saving" name="crescent" class="btn-spinner"></ion-spinner>
                <span v-else>บันทึกเมนู</span>
              </button>
            </div>

          </div>
        </div>
      </ion-modal>

    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { 
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, 
  IonBackButton, IonButtons, IonIcon, IonModal, IonSpinner,
  IonFab, IonFabButton, alertController, toastController
} from '@ionic/vue';
import { addOutline, createOutline, trashOutline, cameraOutline, fastFoodOutline, closeOutline } from 'ionicons/icons';
import { db } from '../../services/firebase';
import { collection, query, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { uploadToCloudinary } from '../../services/cloudinary';
import type { MenuItem } from '../../models/types';
import { useUserStore } from '../../stores/userStore';

const userStore = useUserStore();
const restaurantId = userStore.profile?.restaurantId || 'DEMO_REST_ID';
const menuItems = ref<MenuItem[]>([]);
const showModal = ref(false);
const editingItem = ref<MenuItem | null>(null);
const menuFileInput = ref<HTMLInputElement | null>(null);
const saving = ref(false);
const loadingMenu = ref(true);

const form = ref({
  name: { en: '', th: '' },
  description: { en: '', th: '' },
  price: 0,
  imageUrl: '',
  category: 'General'
});

const loadMenu = async () => {
  loadingMenu.value = true;
  try {
    const q = query(collection(db, `restaurants/${restaurantId}/menus`));
    const snap = await getDocs(q);
    menuItems.value = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as MenuItem));
  } catch (error) {
    console.error("Error loading menu:", error);
  } finally {
    loadingMenu.value = false;
  }
};

onMounted(loadMenu);

const openAddModal = () => {
  editingItem.value = null;
  form.value = { name: { en: '', th: '' }, description: { en: '', th: '' }, price: 0, imageUrl: '', category: 'General' };
  showModal.value = true;
};

const editItem = (item: MenuItem) => {
  editingItem.value = item;
  form.value = { ...item };
  showModal.value = true;
};

const triggerFileUpload = () => menuFileInput.value?.click();

const handleFileUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (target.files?.length) {
    try {
      saving.value = true;
      const res = await uploadToCloudinary(target.files[0], 'menus');
      form.value.imageUrl = res.secure_url;
      
      const toast = await toastController.create({
        message: 'อัปโหลดรูปภาพสำเร็จ', duration: 1500, color: 'success', position: 'bottom'
      });
      await toast.present();
    } catch (e) {
      const toast = await toastController.create({
        message: 'อัปโหลดรูปล้มเหลว', duration: 2000, color: 'danger', position: 'bottom'
      });
      await toast.present();
    } finally {
      saving.value = false;
    }
  }
};

const saveItem = async () => {
  if (!form.value.name.th && !form.value.name.en) {
    const toast = await toastController.create({
      message: 'กรุณากรอกชื่อเมนู', duration: 2000, color: 'warning', position: 'top'
    });
    await toast.present();
    return;
  }

  saving.value = true;
  try {
    if (editingItem.value) {
      await updateDoc(doc(db, `restaurants/${restaurantId}/menus`, editingItem.value.id), form.value);
    } else {
      await addDoc(collection(db, `restaurants/${restaurantId}/menus`), form.value);
    }
    showModal.value = false;
    await loadMenu();
    
    const toast = await toastController.create({
      message: 'บันทึกเมนูสำเร็จ', duration: 2000, color: 'success', position: 'bottom'
    });
    await toast.present();
  } catch (e) {
    console.error(e);
  } finally {
    saving.value = false;
  }
};

const deleteItem = async (id: string) => {
  const alert = await alertController.create({
    header: 'ลบเมนู',
    message: 'คุณแน่ใจหรือไม่ว่าต้องการลบเมนูนี้ออกจากระบบ?',
    buttons: [
      { text: 'ยกเลิก', role: 'cancel' },
      {
        text: 'ลบทิ้ง',
        role: 'destructive',
        handler: async () => {
          await deleteDoc(doc(db, `restaurants/${restaurantId}/menus`, id));
          await loadMenu();
          const toast = await toastController.create({
            message: 'ลบเมนูเรียบร้อยแล้ว', duration: 1500, color: 'success', position: 'bottom'
          });
          await toast.present();
        }
      }
    ]
  });
  await alert.present();
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

/* ================== Background ================== */
.custom-bg {
  --background: #f5f5f5;
}
.content-wrapper {
  padding: 15px 15px 80px 15px; /* เผื่อพื้นที่ให้ FAB */
}

/* ================== Empty States & Loaders ================== */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 60vh;
  text-align: center;
  color: #888;
}
.empty-icon {
  font-size: 70px;
  color: #ddd;
  margin-bottom: 15px;
}
.empty-state h3 {
  font-family: 'Joan', serif;
  font-size: 22px;
  color: #555;
  margin: 0;
}
.empty-state p {
  font-family: 'Inter', sans-serif;
  font-size: 14px;
}
.custom-spinner {
  width: 40px;
  height: 40px;
  color: #9A4444;
}

/* ================== Menu List (Cards) ================== */
.menu-list-container {
  display: flex;
  flex-direction: column;
  gap: 15px;
}
.menu-card {
  display: flex;
  background: white;
  border-radius: 15px;
  overflow: hidden;
  box-shadow: 0 4px 10px rgba(0,0,0,0.05);
  transition: transform 0.2s;
}
.menu-card:active {
  transform: scale(0.98);
}
.menu-img-wrapper {
  width: 120px;
  height: 120px;
  flex-shrink: 0;
}
.menu-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.menu-info {
  flex: 1;
  padding: 12px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}
.menu-name {
  margin: 0;
  font-family: 'Joan', serif;
  font-size: 16px;
  font-weight: bold;
  color: #333;
  display: -webkit-box;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.menu-category {
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  color: #888;
  margin: 4px 0 0 0;
}
.menu-bottom-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 10px;
}
.menu-price {
  font-family: 'Inter', sans-serif;
  font-weight: bold;
  font-size: 16px;
  color: #9A4444;
}
.menu-actions {
  display: flex;
  gap: 5px;
}
.action-icon-btn {
  background: transparent;
  border: none;
  font-size: 20px;
  padding: 5px;
  cursor: pointer;
  border-radius: 5px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.edit-btn { color: #3498db; }
.delete-btn { color: #e74c3c; }
.action-icon-btn:active { background: #f0f0f0; }

/* ================== FAB Button ================== */
.custom-fab-add {
  --background: #9A4444;
  --background-activated: #7a3636;
  --color: #ffffff;
  --box-shadow: 0 4px 15px rgba(154, 68, 68, 0.4);
}

/* ================== Modal Styles ================== */
.custom-modal {
  --height: 90vh;
  --width: 100%;
  --border-radius: 30px 30px 0 0;
  align-items: flex-end; /* ให้โผล่มาจากข้างล่าง */
}
.modal-content {
  background: white;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 20px 10px 20px;
  border-bottom: 1px solid #eee;
}
.modal-title {
  font-family: 'Joan', serif;
  font-size: 22px;
  font-weight: bold;
  margin: 0;
  color: #333;
}
.close-icon {
  font-size: 28px;
  color: #888;
  cursor: pointer;
}
.form-scroll-area {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

/* ================== Image Upload Box ================== */
.menu-image-edit {
  width: 100%;
  max-width: 250px;
  aspect-ratio: 1/1; /* บังคับสี่เหลี่ยมจัตุรัส */
  margin: 0 auto 25px auto;
  position: relative;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 5px 15px rgba(0,0,0,0.1);
  cursor: pointer;
  background: #f4f5f8;
}
.menu-image-edit img { width: 100%; height: 100%; object-fit: cover; }
.overlay {
  position: absolute; top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(0,0,0,0.5); color: white; display: flex; flex-direction: column;
  justify-content: center; align-items: center; opacity: 0; transition: opacity 0.3s;
}
.menu-image-edit:hover .overlay { opacity: 1; }
.camera-icon { font-size: 40px; margin-bottom: 8px; }
.overlay span { font-family: 'Inter', sans-serif; font-size: 13px; }

/* ================== Forms ================== */
.add-form {
  display: flex;
  flex-direction: column;
  gap: 15px;
  padding-bottom: 30px;
}
.input-row {
  display: flex;
  gap: 15px;
}
.half-width {
  flex: 1;
}
.input-group {
  display: flex;
  flex-direction: column;
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
  min-height: 60px;
}

.save-action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #9A4444;
  color: white;
  font-family: 'Inter', sans-serif;
  font-size: 16px;
  font-weight: bold;
  padding: 15px;
  border-radius: 15px;
  border: none;
  margin-top: 10px;
  cursor: pointer;
  box-shadow: 0 4px 15px rgba(154, 68, 68, 0.3);
  transition: transform 0.1s;
}
.save-action-btn:active {
  transform: scale(0.98);
}
.save-action-btn:disabled {
  opacity: 0.7;
}
.btn-spinner {
  color: white;
  width: 24px;
  height: 24px;
}
</style>