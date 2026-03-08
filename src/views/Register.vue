<template>
  <ion-page>
    <ion-content :fullscreen="true" class="custom-background">
      <div class="bg-shape-top"></div>
      <div class="bg-shape-bottom"></div>

      <div class="register-card">
        <h1 class="title">Register</h1>

        <form @submit.prevent="handleSubmit" class="form-container">
          <ion-input v-model="username" class="custom-input" placeholder="Username" type="text" required></ion-input>
          <ion-input v-model="firstName" class="custom-input" placeholder="First name" type="text" required></ion-input>
          <ion-input v-model="lastName" class="custom-input" placeholder="Last name" type="text" required></ion-input>
          <ion-input v-model="password" class="custom-input" placeholder="Password" type="password" required></ion-input>
          <ion-input v-model="confirmPassword" class="custom-input" placeholder="Confirm Password" type="password" required></ion-input>
          <ion-input v-model="email" class="custom-input" placeholder="Email" type="email" required></ion-input>
          <ion-input v-model="phone" class="custom-input" placeholder="Phone number" type="tel" required></ion-input>

          <button type="submit" class="submit-btn" :disabled="isLoading">
            {{ isLoading ? 'กำลังสมัคร...' : 'REGISTER' }}
          </button>
          
          <a @click="router.push('/login')" class="link mt-3">Already have an account? Login</a>
        </form>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { ref } from 'vue';
import { IonPage, IonContent, IonInput } from '@ionic/vue';
import { useRouter } from 'vue-router';
import { registerService } from '../services/authService.ts';

const router = useRouter();
const username = ref('');
const firstName = ref('');
const lastName = ref('');
const password = ref('');
const confirmPassword = ref('');
const email = ref('');
const phone = ref('');
const isLoading = ref(false);

const handleSubmit = async () => {
  if (password.value !== confirmPassword.value) {
    alert("รหัสผ่านไม่ตรงกัน กรุณาตรวจสอบอีกครั้ง");
    return;
  }

  isLoading.value = true;
  const userData = {
    username: username.value,
    firstName: firstName.value,
    lastName: lastName.value,
    phone: phone.value
  };

  const result = await registerService(email.value, password.value, userData);
  isLoading.value = false;

  if (result.success) {
    alert("สมัครสมาชิกสำเร็จ!");
    router.push('/select-role');
  } else {
    alert(result.message);
  }
};
</script>

<style scoped>
/* CSS จะเหมือนกับหน้า Login เลยครับ */
.custom-background { --background: #f5f5f5; position: relative; }
.bg-shape-top { position: absolute; top: 0; left: 0; width: 100%; height: 35vh; background: linear-gradient(180deg, #7c3535 0%, #c5693b 100%); border-bottom-left-radius: 50%; border-bottom-right-radius: 50%; z-index: 1; }
.bg-shape-bottom { position: absolute; bottom: -50px; left: 50%; transform: translateX(-50%); width: 80vw; height: 20vh; background: #c5693b; border-top-left-radius: 50%; border-top-right-radius: 50%; z-index: 1; }
.register-card { position: relative; z-index: 10; background: white; margin: 10vh 20px 20px 20px; padding: 30px 20px; border-radius: 15px; box-shadow: 0px 8px 20px rgba(0, 0, 0, 0.15); display: flex; flex-direction: column; align-items: center; }
.title { font-family: 'Times New Roman', Times, serif; font-size: 42px; color: #000; margin-top: 0; margin-bottom: 20px; text-align: center; }
.form-container { width: 100%; display: flex; flex-direction: column; align-items: center; }
.custom-input { --background: transparent; --padding-start: 15px; --padding-end: 15px; --padding-top: 10px; --padding-bottom: 10px; --placeholder-color: #999; width: 100%; border: 1.5px solid #d4a3a3; border-radius: 8px; margin-bottom: 10px; font-size: 14px; }
.custom-input::part(native) { padding: 0; }
.submit-btn { background: #8b3c3c; color: white; font-size: 18px; font-weight: bold; letter-spacing: 1px; padding: 12px 40px; border: none; border-radius: 30px; margin-top: 15px; box-shadow: 0px 5px 10px rgba(0, 0, 0, 0.2); cursor: pointer; transition: transform 0.2s ease; width: 60%; }
.submit-btn:active { transform: scale(0.95); }
.submit-btn:disabled { opacity: 0.7; cursor: not-allowed; }
.link { font-size: 13px; color: #a45a5a; text-decoration: none; transition: color 0.2s; cursor: pointer; }
.link:hover { color: #8b3c3c; text-decoration: underline; }
.mt-3 { margin-top: 15px; }
</style>