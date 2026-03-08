<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/home"></ion-back-button>
        </ion-buttons>
        <ion-title>{{ $t('common.profile') }}</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <div v-if="userStore.loading" class="ion-text-center ion-padding">
        <ion-spinner name="crescent"></ion-spinner>
      </div>

      <div v-else-if="userStore.profile" class="profile-container">
        <div class="profile-header ion-text-center">
          <div class="avatar-wrapper">
            <img :src="userStore.profile.avatarUrl || 'https://via.placeholder.com/150?text=User'" />
          </div>
          <h2>{{ userStore.profile.fullName }}</h2>
          <p class="email-text">{{ userStore.profile.email }}</p>
          <ion-badge color="primary">{{ userStore.profile.role }}</ion-badge>
        </div>

        <ion-list class="ion-margin-top">
          <ion-item>
            <ion-icon :icon="personOutline" slot="start"></ion-icon>
            <ion-label>
              <p>Full Name</p>
              <h3>{{ userStore.profile.fullName }}</h3>
            </ion-label>
          </ion-item>
          <ion-item>
            <ion-icon :icon="mailOutline" slot="start"></ion-icon>
            <ion-label>
              <p>Email</p>
              <h3>{{ userStore.profile.email }}</h3>
            </ion-label>
          </ion-item>
          <ion-item>
            <ion-icon :icon="shieldCheckmarkOutline" slot="start"></ion-icon>
            <ion-label>
              <p>{{ $t('auth.role') }}</p>
              <h3>{{ userStore.profile.role }}</h3>
            </ion-label>
          </ion-item>
          <ion-item v-if="userStore.profile.restaurantId">
            <ion-icon :icon="briefcaseOutline" slot="start"></ion-icon>
            <ion-label>
              <p>Workplace ID</p>
              <h3>{{ userStore.profile.restaurantId }}</h3>
            </ion-label>
          </ion-item>
        </ion-list>

        <ion-button expand="block" color="danger" fill="outline" class="ion-margin-top" @click="confirmLogout">
          <ion-icon :icon="logOutOutline" slot="start"></ion-icon>
          {{ $t('common.logout') }}
        </ion-button>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonButtons, IonBackButton, IonAvatar, IonItem, IonLabel,
  IonList, IonButton, IonIcon, IonBadge, IonSpinner, alertController
} from '@ionic/vue';
import { 
  personOutline, mailOutline, shieldCheckmarkOutline, 
  logOutOutline, briefcaseOutline 
} from 'ionicons/icons';
import { useUserStore } from '../stores/userStore';
import { useRouter } from 'vue-router';
import { auth } from '../services/firebase';
import { signOut } from 'firebase/auth';
import { useI18n } from 'vue-i18n';

const userStore = useUserStore();
const router = useRouter();
const { t } = useI18n();

const confirmLogout = async () => {
  const alert = await alertController.create({
    header: t('common.logout'),
    message: t('auth.logout_confirm'),
    buttons: [
      { text: t('common.cancel'), role: 'cancel' },
      { 
        text: t('common.logout'), 
        handler: async () => {
          await signOut(auth);
          router.push('/login');
        }
      }
    ]
  });
  await alert.present();
};
</script>

<style scoped>
.profile-container {
  max-width: 500px;
  margin: 0 auto;
}
.profile-header {
  padding: 2rem 0;
}
.avatar-wrapper {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  overflow: hidden;
  margin: 0 auto 1rem;
  border: 4px solid var(--ion-color-primary);
}
.avatar-wrapper img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.email-text {
  color: var(--ion-color-medium);
  margin-bottom: 0.5rem;
}
h2 {
  font-weight: bold;
  margin: 0.5rem 0;
}
</style>
