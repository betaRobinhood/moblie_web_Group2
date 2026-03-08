<template>
  <ion-page>
    <ion-content :class="'bg-step-' + currentStep" :fullscreen="true">
      
      <div v-if="currentStep === 0" class="screen-container splash-container">
        <div class="logo-wrapper">
          <div class="logo-text">
            <span class="small-text">THAI RESTAURANT</span>
            <div class="icon-fork-spoon">🍽️</div> <span class="main-text">EzyDine</span>
          </div>
        </div>
        <div class="circle bottom-left"></div>
        <div class="circle bottom-right"></div>
      </div>

      <div v-if="currentStep === 1" class="screen-container">
        <div class="top-bar">
          <button class="btn-skip" @click="skipOnboarding">Skip</button>
        </div>

        <div class="content-center">
          <div class="logo-text-small">
            <span class="small-text">THAI RESTAURANT</span>
            <div class="icon-fork-spoon-small">🍽️</div>
            <span class="main-text-small">EzyDine</span>
          </div>
          <h2 class="title-thai">จองคิว ดูคิว สั่งอาหาร<br>ครบจบในที่เดียว</h2>
          
          <div class="image-circle">
             <img src="../assets/1.png" alt="Chef">
          </div>
        </div>

        <div class="bottom-bar">
          <button class="btn-next" @click="currentStep = 2">Next</button>
        </div>
      </div>

      <div v-if="currentStep === 2" class="screen-container">
        <div class="top-bar">
          <button class="btn-skip" @click="skipOnboarding">Skip</button>
        </div>

        <div class="content-center">
          <div class="image-circle">
             <img src="../assets/2.png" alt="Restaurants">
          </div>
          
          <h2 class="title-eng">
            You can enjoy dishes from top<br>chefs with just a few clicks.<br><br>
            And discover many more<br>restaurants in a single app.
          </h2>
        </div>

        <div class="bottom-bar dual-btn">
          <button class="btn-back" @click="currentStep = 1">Back</button>
          <button class="btn-next" @click="finishOnboarding">Next</button>
        </div>
      </div>

    </ion-content>
  </ion-page>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { IonPage, IonContent } from '@ionic/vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const currentStep = ref(0);

onMounted(() => {
  setTimeout(() => {
    if (currentStep.value === 0) {
      currentStep.value = 1;
    }
  }, 2500);
});

const skipOnboarding = () => {
  finishOnboarding();
};

const finishOnboarding = () => {
  console.log('ไปที่หน้าเข้าสู่ระบบ หรือหน้าหลัก');
  router.push('/login');
};
</script>

<style scoped>
/* นำเข้าฟอนต์ตามดีไซน์ */
@import url('https://fonts.googleapis.com/css2?family=Gugi&family=Itim&family=Joan&display=swap');

/* ================== สีพื้นหลังของแต่ละหน้า ================== */
.bg-step-0 {
  --background: #9A4444;
}
.bg-step-1 {
  --background: linear-gradient(90deg, #C06139 0%, #9A4444 68.28%);
}
.bg-step-2 {
  --background: linear-gradient(90deg, #9A4444 0%, #572626 84.17%);
}

.screen-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  position: relative;
  overflow: hidden;
}

/* ================== Splash Screen ================== */
.splash-container {
  justify-content: center;
  align-items: center;
}
.logo-wrapper {
  text-align: center;
  color: white;
  z-index: 10;
}
.small-text {
  font-family: 'Gugi', cursive;
  font-size: 14px;
  letter-spacing: 2px;
}
.icon-fork-spoon {
  font-size: 40px;
  margin: 10px 0;
}
.main-text {
  font-family: 'Gugi', cursive;
  font-size: 48px;
  font-weight: bold;
}

/* วงกลมตกแต่งด้านล่างหน้า Splash */
.circle {
  position: absolute;
  background: #FFFFFF;
  border-radius: 50%;
}
.bottom-left {
  width: 288px;
  height: 288px;
  left: -73px;
  bottom: -100px;
  border: 10px solid #EDEDED;
}
.bottom-right {
  width: 219px;
  height: 219px;
  right: -50px;
  bottom: -80px;
  border: 10px solid #EDEDED;
}

/* ================== Onboarding 1 & 2 ================== */
.top-bar {
  display: flex;
  justify-content: flex-end;
  padding: 30px 20px 0 0;
}
.btn-skip {
  width: 80px;
  height: 35px;
  background: #000000;
  color: #FFFFFF;
  border-radius: 45px;
  font-family: 'Itim', cursive;
  font-size: 18px;
  box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.25);
}

.content-center {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 0 20px;
}

.logo-text-small {
  color: white;
  margin-bottom: 20px;
}
.main-text-small {
  font-family: 'Gugi', cursive;
  font-size: 32px;
}
.icon-fork-spoon-small {
  font-size: 24px;
}

.title-thai {
  font-family: 'Gugi', cursive;
  font-size: 24px;
  color: #FFFFFF;
  margin-bottom: 30px;
  line-height: 1.5;
}

.title-eng {
  font-family: 'Joan', serif;
  font-size: 18px;
  margin-top: 30px;
  background: linear-gradient(90deg, #FFFFFF 0%, #CB9F9F 100%);
  background-clip: text;
  -webkit-text-fill-color: transparent;
  line-height: 1.5;
}

.image-circle {
  width: 240px;
  height: 240px;
  border-radius: 50%;
  overflow: hidden;
  box-shadow: 0px 10px 15px rgba(0,0,0,0.3);
}
.image-circle img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* ================== ปุ่มด้านล่าง ================== */
.bottom-bar {
  display: flex;
  justify-content: flex-end;
  padding: 0 30px 40px 0;
}
.dual-btn {
  justify-content: space-between;
  padding: 0 30px 40px 30px;
}

.btn-next, .btn-back {
  width: 100px;
  height: 43px;
  background: #FFFFFF;
  color: #9A4444;
  border-radius: 45px;
  font-family: 'Itim', cursive;
  font-size: 22px;
  box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.25);
}
</style>