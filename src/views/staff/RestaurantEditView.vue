<template>
  <ion-page v-if="restaurant">
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/staff/dashboard"></ion-back-button>
        </ion-buttons>
        <ion-title>Manage Restaurant</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="saveChanges" :disabled="saving">
            <ion-spinner v-if="saving"></ion-spinner>
            <span v-else>Save</span>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <div class="header-image-edit" @click="triggerImageUpload">
        <img :src="restaurant.coverImageUrl || 'https://via.placeholder.com/600x300'" />
        <div class="overlay">
          <ion-icon :icon="cameraOutline"></ion-icon>
          <p>Change Image</p>
        </div>
        <input type="file" ref="fileInput" style="display: none" @change="handleImageChange" accept="image/*" />
      </div>

      <ion-list>
        <ion-item-divider>
          <ion-label>Basic Information</ion-label>
        </ion-item-divider>
        
        <ion-item>
          <ion-label position="stacked">Name (EN)</ion-label>
          <ion-input v-model="restaurant.name.en"></ion-input>
        </ion-item>
        <ion-item>
          <ion-label position="stacked">Name (TH)</ion-label>
          <ion-input v-model="restaurant.name.th"></ion-input>
        </ion-item>

        <ion-item>
          <ion-label position="stacked">Description (EN)</ion-label>
          <ion-textarea v-model="restaurant.description.en" :rows="3"></ion-textarea>
        </ion-item>
        <ion-item>
          <ion-label position="stacked">Description (TH)</ion-label>
          <ion-textarea v-model="restaurant.description.th" :rows="3"></ion-textarea>
        </ion-item>

        <ion-item>
          <ion-label position="stacked">Location</ion-label>
          <ion-input v-model="restaurant.location"></ion-input>
        </ion-item>

        <ion-item>
          <ion-label position="stacked">Avg Dining Time (mins)</ion-label>
          <ion-input type="number" :value="restaurant.avgDiningTime" @ionInput="restaurant.avgDiningTime = Number(($event.target as any).value)"></ion-input>
        </ion-item>

        <ion-item>
          <ion-label>Queue Enabled</ion-label>
          <ion-toggle v-model="restaurant.queueEnabled" slot="end"></ion-toggle>
        </ion-item>
      </ion-list>

      <ion-grid>
        <ion-row>
          <ion-col>
            <ion-button expand="block" fill="outline" router-link="/staff/tables">
              Manage Tables
            </ion-button>
          </ion-col>
          <ion-col>
            <ion-button expand="block" fill="outline" router-link="/staff/menu">
              Manage Menu
            </ion-button>
          </ion-col>
        </ion-row>
      </ion-grid>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { 
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, 
  IonBackButton, IonButtons, IonButton, IonItem, IonLabel,
  IonInput, IonTextarea, IonToggle, IonSpinner, IonIcon,
  IonItemDivider, IonGrid, IonRow, IonCol
} from '@ionic/vue';
import { cameraOutline } from 'ionicons/icons';
import { db } from '../../services/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { uploadToCloudinary } from '../../services/cloudinary';
import type { Restaurant } from '../../models/types';
import { useUserStore } from '../../stores/userStore';

const restaurant = ref<Restaurant | null>(null);
const fileInput = ref<HTMLInputElement | null>(null);
const saving = ref(false);
const userStore = useUserStore();
const restaurantId = userStore.profile?.restaurantId || 'DEMO_REST_ID';

onMounted(async () => {
  const docRef = doc(db, 'restaurants', restaurantId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    restaurant.value = { id: docSnap.id, ...docSnap.data() } as Restaurant;
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
    } catch (e) {
      console.error(e);
      alert('Upload failed');
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
    alert('Changes saved successfully');
  } catch (e) {
    console.error(e);
    alert('Save failed');
  } finally {
    saving.value = false;
  }
};
</script>

<style scoped>
.header-image-edit {
  position: relative;
  width: 100%;
  height: 200px;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 1rem;
  cursor: pointer;
}
.header-image-edit img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0,0,0,0.4);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: white;
  opacity: 0;
  transition: opacity 0.3s;
}
.header-image-edit:hover .overlay {
  opacity: 1;
}
</style>
