<template>
  <ion-page>
    <ion-content :fullscreen="true" class="custom-background">
      <div class="bg-shape-top"></div>
      <div class="bg-shape-bottom"></div>

      <div class="login-card">
        <h1 class="title">EzyDine</h1>
        <p class="subtitle">Real-time Restaurant Queuing</p>

        <form @submit.prevent="login" class="form-container">
          <ion-input 
            v-model="email" 
            class="custom-input" 
            :placeholder="$t('auth.email')" 
            type="email" 
            autocomplete="email"
            required>
          </ion-input>

          <div class="input-wrapper">
            <ion-input 
              v-model="password" 
              class="custom-input password-input" 
              :placeholder="$t('auth.password')" 
              type="password" 
              required>
            </ion-input>
            <ion-icon :icon="lockClosedOutline" class="input-icon"></ion-icon>
          </div>

          <p v-if="errorMsg" class="error-msg">{{ errorMsg }}</p>

          <button type="submit" class="submit-btn" :disabled="loading">
            <span v-if="loading">Loading...</span>
            <span v-else>{{ $t('auth.login_button') }}</span>
          </button>

          <hr class="divider" />

          <div class="links-container">
            <a @click="router.push('/register')" class="link">{{ $t('auth.no_account') }} {{ $t('auth.register_button') }}</a>
            <a href="#" class="link">forget password</a>
          </div>

          <div class="lang-switch mt-4">
            <a @click="setLang('en')" :class="{'active-lang': currentLang === 'en'}" class="lang-btn">EN</a> 
            <span class="lang-divider">|</span>
            <a @click="setLang('th')" :class="{'active-lang': currentLang === 'th'}" class="lang-btn">TH</a>
          </div>
        </form>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { IonPage, IonContent, IonInput, IonIcon } from '@ionic/vue';
import { lockClosedOutline } from 'ionicons/icons';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';

// นำเข้า Store และ Service ตามต้นฉบับ LoginView.vue ของคุณ
import { useUserStore } from '../stores/userStore';
import { auth as firebaseAuth } from '../services/firebase'; 
import { signInWithEmailAndPassword } from 'firebase/auth';

const router = useRouter();
const userStore = useUserStore();
const { locale } = useI18n();

const email = ref('');
const password = ref('');
const loading = ref(false);
const errorMsg = ref('');

// ดึงค่าภาษาปัจจุบัน
const currentLang = computed(() => locale.value);

// ฟังก์ชันล็อกอิน (ตามต้นฉบับ)
const login = async () => {
  if (!email.value || !password.value) {
    errorMsg.value = 'Please enter email and password.';
    return;
  }
  errorMsg.value = '';
  loading.value = true;
  
  try {
    await signInWithEmailAndPassword(firebaseAuth, email.value, password.value);
    router.push('/home'); // ไปหน้า /home เมื่อสำเร็จ
  } catch (error: any) {
    console.error(error);
    errorMsg.value = error.code === 'auth/invalid-credential'
      ? 'Invalid email or password.'
      : 'Login failed. Please try again.';
  } finally {
    loading.value = false;
  }
};

// ฟังก์ชันเปลี่ยนภาษา (ตามต้นฉบับ)
const setLang = (lang: string) => {
  locale.value = lang;
  userStore.setLanguage(lang);
};
</script>

<style scoped>
/* ================= CSS ส่วนพื้นหลัง ================= */
.custom-background { --background: #f5f5f5; position: relative; }
.bg-shape-top { position: absolute; top: 0; left: 0; width: 100%; height: 35vh; background: linear-gradient(180deg, #7c3535 0%, #c5693b 100%); border-bottom-left-radius: 50%; border-bottom-right-radius: 50%; z-index: 1; }
.bg-shape-bottom { position: absolute; bottom: -50px; left: 50%; transform: translateX(-50%); width: 80vw; height: 20vh; background: #c5693b; border-top-left-radius: 50%; border-top-right-radius: 50%; z-index: 1; }

/* ================= CSS ส่วนกล่อง Login ================= */
.login-card { position: relative; z-index: 10; background: white; margin: 15vh 20px 20px 20px; padding: 40px 20px 30px 20px; border-radius: 15px; box-shadow: 0px 8px 20px rgba(0, 0, 0, 0.15); display: flex; flex-direction: column; align-items: center; }

/* เปลี่ยนจากคำว่า LOGIN เป็น EzyDine ตามไฟล์เดิม */
.title { font-family: 'Times New Roman', Times, serif; font-size: 42px; color: #1a0f0f; margin-top: 0; margin-bottom: 5px; text-align: center; font-weight: bold; }
.subtitle { color: #888; font-size: 14px; margin-bottom: 25px; text-align: center; }

.form-container { width: 100%; display: flex; flex-direction: column; align-items: center; }

/* ================= CSS ส่วน Input ================= */
.custom-input { --background: transparent; --padding-start: 15px; --padding-end: 15px; --padding-top: 14px; --padding-bottom: 14px; --placeholder-color: #888; width: 100%; border: 1.5px solid #d4a3a3; border-radius: 8px; margin-bottom: 15px; font-size: 15px; }
.custom-input::part(native) { padding: 0; }
.input-wrapper { position: relative; width: 100%; }
.password-input { --padding-end: 45px; }
.input-icon { position: absolute; right: 15px; top: 42%; transform: translateY(-50%); font-size: 20px; color: #777; z-index: 2; }

/* ข้อความ Error สีแดง */
.error-msg { color: #dc3545; font-size: 13px; margin: -5px 0 15px 0; width: 100%; text-align: left; padding-left: 5px; }

/* ================= CSS ส่วนปุ่มและลิงก์ ================= */
.submit-btn { background: #8b3c3c; color: white; font-size: 18px; font-weight: bold; letter-spacing: 1px; padding: 15px 40px; border: none; border-radius: 30px; margin-top: 5px; box-shadow: 0px 5px 10px rgba(0, 0, 0, 0.2); cursor: pointer; transition: transform 0.2s ease; width: 60%; }
.submit-btn:active { transform: scale(0.95); }
.submit-btn:disabled { opacity: 0.7; cursor: not-allowed; }

.divider { width: 100%; height: 3px; background-color: #8b3c3c; border: none; margin: 30px 0 20px 0; }

.links-container { width: 100%; display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 0 5px; }
.link { font-size: 13px; color: #a45a5a; text-decoration: none; transition: color 0.2s; cursor: pointer; }
.link:hover { color: #8b3c3c; text-decoration: underline; }

/* ================= CSS ส่วนสลับภาษา ================= */
.mt-4 { margin-top: 20px; }
.lang-switch { display: flex; align-items: center; justify-content: center; gap: 10px; }
.lang-btn { font-size: 14px; color: #888; cursor: pointer; font-weight: bold; transition: color 0.2s; }
.active-lang { color: #c5693b; text-decoration: underline; }
.lang-divider { color: #ccc; }
</style>