<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>{{ $t('auth.login_button') }}</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <div class="login-container">
        <h1>EzyDine</h1>
        <p>Real-time Restaurant Queuing</p>

        <ion-item>
          <ion-label position="stacked">{{ $t('auth.email') }}</ion-label>
          <ion-input v-model="email" type="email" placeholder="email@example.com" autocomplete="email"></ion-input>
        </ion-item>

        <ion-item>
          <ion-label position="stacked">{{ $t('auth.password') }}</ion-label>
          <ion-input v-model="password" type="password"></ion-input>
        </ion-item>

        <p v-if="errorMsg" class="error-msg">{{ errorMsg }}</p>

        <ion-button expand="block" @click="login" :disabled="loading" class="ion-margin-top">
          <ion-spinner v-if="loading" name="crescent"></ion-spinner>
          <span v-else>{{ $t('auth.login_button') }}</span>
        </ion-button>

        <div class="ion-text-center ion-margin-top">
          <p>{{ $t('auth.no_account') }} <a @click="router.push('/register')">{{ $t('auth.register_button') }}</a></p>
        </div>

        <div class="lang-switch ion-margin-top ion-text-center">
          <ion-button fill="clear" @click="setLang('en')" :color="currentLang === 'en' ? 'primary' : 'medium'">EN</ion-button>
          <ion-button fill="clear" @click="setLang('th')" :color="currentLang === 'th' ? 'primary' : 'medium'">TH</ion-button>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonItem, IonLabel, IonInput, IonButton, IonSpinner
} from '@ionic/vue';
import { useUserStore } from '../stores/userStore';
import { auth as firebaseAuth } from '../services/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';

const email = ref('');
const password = ref('');
const loading = ref(false);
const errorMsg = ref('');
const userStore = useUserStore();
const router = useRouter();
const { locale } = useI18n();

const currentLang = computed(() => locale.value);

const login = async () => {
  if (!email.value || !password.value) {
    errorMsg.value = 'Please enter email and password.';
    return;
  }
  errorMsg.value = '';
  loading.value = true;
  try {
    await signInWithEmailAndPassword(firebaseAuth, email.value, password.value);
    router.push('/home');
  } catch (error: any) {
    console.error(error);
    errorMsg.value = error.code === 'auth/invalid-credential'
      ? 'Invalid email or password.'
      : 'Login failed. Please try again.';
  } finally {
    loading.value = false;
  }
};

const setLang = (lang: string) => {
  locale.value = lang;
  userStore.setLanguage(lang);
};
</script>

<style scoped>
.login-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  height: 100%;
  max-width: 400px;
  margin: 0 auto;
  padding-top: 4rem;
}
h1 {
  text-align: center;
  font-size: 2.5rem;
  font-weight: bold;
  margin-bottom: 0;
}
p {
  text-align: center;
  color: var(--ion-color-medium);
  margin-bottom: 1rem;
}
.error-msg {
  color: var(--ion-color-danger);
  font-size: 0.85rem;
  margin-top: 0.5rem;
}
</style>
