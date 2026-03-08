<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/login"></ion-back-button>
        </ion-buttons>
        <ion-title>{{ $t('auth.register_button') }}</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <div class="register-container">
        <div class="avatar-selection ion-text-center" @click="triggerAvatarSelection">
          <div class="avatar-preview">
            <img :src="avatarPreview || 'https://via.placeholder.com/150?text=Avatar'" />
            <div class="upload-overlay">
              <ion-icon :icon="cameraOutline"></ion-icon>
            </div>
          </div>
          <p>{{ $t('auth.avatar') }}</p>
          <input type="file" ref="avatarInput" style="display: none" @change="handleAvatarChange" accept="image/*" />
        </div>

        <ion-item>
          <ion-label position="stacked">{{ $t('auth.full_name') }}</ion-label>
          <ion-input v-model="fullName" type="text" placeholder="John Doe"></ion-input>
        </ion-item>

        <ion-item>
          <ion-label position="stacked">{{ $t('auth.email') }}</ion-label>
          <ion-input v-model="email" type="email" placeholder="email@example.com"></ion-input>
        </ion-item>

        <ion-item>
          <ion-label position="stacked">{{ $t('auth.password') }}</ion-label>
          <ion-input v-model="password" type="password"></ion-input>
        </ion-item>

        <p v-if="errorMsg" class="error-msg ion-padding-horizontal">{{ errorMsg }}</p>

        <ion-button expand="block" @click="register" :disabled="loading" class="ion-margin-top">
          <ion-spinner v-if="loading" name="crescent"></ion-spinner>
          <span v-else>{{ $t('auth.register_button') }}</span>
        </ion-button>

        <div class="ion-text-center ion-margin-top">
          <p>{{ $t('auth.have_account') }} <a @click="router.push('/login')">{{ $t('auth.login_button') }}</a></p>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonItem, IonLabel, IonInput, IonButton, IonSpinner,
  IonIcon, IonButtons, IonBackButton, toastController
} from '@ionic/vue';
import { cameraOutline } from 'ionicons/icons';
import { auth, db } from '../services/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { uploadToCloudinary } from '../services/cloudinary';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';

const fullName = ref('');
const email = ref('');
const password = ref('');
const loading = ref(false);
const errorMsg = ref('');
const avatarPreview = ref('');
const avatarFile = ref<File | null>(null);
const avatarInput = ref<HTMLInputElement | null>(null);

const router = useRouter();
const { t } = useI18n();

const triggerAvatarSelection = () => {
  avatarInput.value?.click();
};

const handleAvatarChange = (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (target.files?.length) {
    const file = target.files[0];
    avatarFile.value = file;
    avatarPreview.value = URL.createObjectURL(file);
  }
};

const register = async () => {
  if (!email.value || !password.value || !fullName.value) {
    errorMsg.value = 'Please fill in all fields';
    return;
  }
  
  errorMsg.value = '';
  loading.value = true;
  
  try {
    // 1. Create user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email.value, password.value);
    const user = userCredential.user;
    
    let avatarUrl = '';
    
    // 2. Upload avatar if selected
    if (avatarFile.value) {
      const res = await uploadToCloudinary(avatarFile.value, 'avatars');
      avatarUrl = res.secure_url;
    }
    
    // 3. Create user profile in Firestore
    await setDoc(doc(db, 'users', user.uid), {
      fullName: fullName.value,
      email: email.value,
      avatarUrl: avatarUrl,
      role: 'customer',
      language: 'en',
      createdAt: new Date()
    });
    
    const toast = await toastController.create({
      message: t('auth.register_success'),
      duration: 2000,
      color: 'success',
      position: 'bottom'
    });
    await toast.present();
    
    router.push('/home');
  } catch (error: any) {
    console.error(error);
    errorMsg.value = error.message;
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.register-container {
  max-width: 400px;
  margin: 0 auto;
}
.avatar-selection {
  margin: 2rem 0;
}
.avatar-preview {
  position: relative;
  width: 120px;
  height: 120px;
  margin: 0 auto;
  border-radius: 50%;
  overflow: hidden;
  border: 4px solid var(--ion-color-primary);
}
.avatar-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.upload-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0,0,0,0.3);
  display: flex;
  justify-content: center;
  align-items: center;
  color: white;
  font-size: 1.5rem;
  opacity: 0;
  transition: opacity 0.3s;
}
.avatar-preview:hover .upload-overlay {
  opacity: 1;
}
.error-msg {
  color: var(--ion-color-danger);
  font-size: 0.85rem;
  margin-top: 1rem;
}
</style>
