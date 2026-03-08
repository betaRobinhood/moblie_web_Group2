<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/staff/management"></ion-back-button>
        </ion-buttons>
        <ion-title>Manage Menu</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="openAddModal">
            <ion-icon :icon="addOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <ion-list>
        <ion-item v-for="item in menuItems" :key="item.id">
          <ion-thumbnail slot="start">
            <img :src="item.imageUrl" />
          </ion-thumbnail>
          <ion-label>
            <h2>{{ item.name.en }} / {{ item.name.th }}</h2>
            <p>{{ item.price }} THB</p>
          </ion-label>
          <ion-button slot="end" fill="clear" @click="editItem(item)">
            <ion-icon :icon="createOutline"></ion-icon>
          </ion-button>
          <ion-button slot="end" fill="clear" color="danger" @click="deleteItem(item.id)">
            <ion-icon :icon="trashOutline"></ion-icon>
          </ion-button>
        </ion-item>
      </ion-list>

      <!-- Add/Edit Modal -->
      <ion-modal :is-open="showModal" @didDismiss="showModal = false">
        <ion-header>
          <ion-toolbar>
            <ion-title>{{ editingItem ? 'Edit Item' : 'Add Item' }}</ion-title>
            <ion-buttons slot="end">
              <ion-button @click="showModal = false">Cancel</ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>
        <ion-content class="ion-padding">
          <div class="menu-image-edit" @click="triggerFileUpload">
            <img :src="form.imageUrl || 'https://via.placeholder.com/150'" />
            <div class="overlay"><ion-icon :icon="cameraOutline"></ion-icon></div>
            <input type="file" ref="menuFileInput" style="display: none" @change="handleFileUpload" accept="image/*" />
          </div>

          <ion-item>
            <ion-label position="stacked">Name (EN)</ion-label>
            <ion-input v-model="form.name.en"></ion-input>
          </ion-item>
          <ion-item>
            <ion-label position="stacked">Name (TH)</ion-label>
            <ion-input v-model="form.name.th"></ion-input>
          </ion-item>
          <ion-item>
            <ion-label position="stacked">Price (THB)</ion-label>
            <ion-input type="number" v-model.number="form.price"></ion-input>
          </ion-item>
          <ion-item>
            <ion-label position="stacked">Category</ion-label>
            <ion-input v-model="form.category"></ion-input>
          </ion-item>

          <ion-button expand="block" class="ion-margin-top" @click="saveItem" :disabled="saving">
            <ion-spinner v-if="saving"></ion-spinner>
            <span v-else>Save Item</span>
          </ion-button>
        </ion-content>
      </ion-modal>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { 
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, 
  IonBackButton, IonButtons, IonList, IonItem, IonLabel,
  IonThumbnail, IonButton, IonIcon, IonModal, IonInput, IonSpinner
} from '@ionic/vue';
import { addOutline, createOutline, trashOutline, cameraOutline } from 'ionicons/icons';
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

const form = ref({
  name: { en: '', th: '' },
  description: { en: '', th: '' },
  price: 0,
  imageUrl: '',
  category: 'General'
});

const loadMenu = async () => {
  const q = query(collection(db, `restaurants/${restaurantId}/menus`));
  const snap = await getDocs(q);
  menuItems.value = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as MenuItem));
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
    } catch (e) {
      alert('Upload failed');
    } finally {
      saving.value = false;
    }
  }
};

const saveItem = async () => {
  saving.value = true;
  try {
    if (editingItem.value) {
      await updateDoc(doc(db, `restaurants/${restaurantId}/menus`, editingItem.value.id), form.value);
    } else {
      await addDoc(collection(db, `restaurants/${restaurantId}/menus`), form.value);
    }
    showModal.value = false;
    await loadMenu();
  } finally {
    saving.value = false;
  }
};

const deleteItem = async (id: string) => {
  if (confirm('Delete this item?')) {
    await deleteDoc(doc(db, `restaurants/${restaurantId}/menus`, id));
    await loadMenu();
  }
};
</script>

<style scoped>
.menu-image-edit {
  width: 150px;
  height: 150px;
  margin: 0 auto 1rem;
  position: relative;
  border-radius: 8px;
  overflow: hidden;
}
.menu-image-edit img { width: 100%; height: 100%; object-fit: cover; }
.overlay {
  position: absolute; top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(0,0,0,0.4); color: white; display: flex;
  justify-content: center; align-items: center; opacity: 0; transition: 0.3s;
}
.menu-image-edit:hover .overlay { opacity: 1; }
</style>
