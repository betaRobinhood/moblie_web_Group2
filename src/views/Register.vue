<template>
  <ion-page>
    <ion-content :fullscreen="true" class="custom-background">
      <div class="bg-shape-top"></div>
      <div class="bg-shape-bottom"></div>

      <div class="register-card">
        <h1 class="title">Register</h1>

        <form @submit.prevent="handleSubmit" class="form-container">
          <ion-input class="custom-input" placeholder="Username" type="text"></ion-input>
          <ion-input class="custom-input" placeholder="First name" type="text"></ion-input>
          <ion-input class="custom-input" placeholder="Last name" type="text"></ion-input>
          <ion-input class="custom-input" placeholder="Password" type="password"></ion-input>
          <ion-input class="custom-input" placeholder="Confirm Password" type="password"></ion-input>
          <ion-input class="custom-input" placeholder="Email" type="email"></ion-input>
          <ion-input class="custom-input" placeholder="Phone number" type="tel"></ion-input>

          <button type="submit" class="submit-btn">LOGIN</button>
        </form>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { IonPage, IonContent, IonInput } from '@ionic/vue';

const handleSubmit = () => {
  console.log('Form submitted!');
  // ใส่ Logic สำหรับการสมัครสมาชิกที่นี่
};
</script>

<style scoped>
/* พื้นหลังของหน้าจอ */
.custom-background {
  --background: #f5f5f5; /* สีพื้นหลังหลักแบบสว่าง */
  position: relative;
}

/* ส่วนโค้งมนด้านบน */
.bg-shape-top {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 35vh;
  background: linear-gradient(180deg, #7c3535 0%, #c5693b 100%);
  border-bottom-left-radius: 50%;
  border-bottom-right-radius: 50%;
  z-index: 1;
}

/* ส่วนโค้งมนด้านล่าง */
.bg-shape-bottom {
  position: absolute;
  bottom: -50px;
  left: 50%;
  transform: translateX(-50%);
  width: 80vw;
  height: 20vh;
  background: #c5693b;
  border-top-left-radius: 50%;
  border-top-right-radius: 50%;
  z-index: 1;
}

/* กล่องสีขาว (Card) */
.register-card {
  position: relative;
  z-index: 10;
  background: white;
  margin: 15vh 20px 20px 20px;
  padding: 30px 20px;
  border-radius: 15px;
  box-shadow: 0px 8px 20px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* หัวข้อ Register */
.title {
  font-family: 'Times New Roman', Times, serif; /* ใช้ฟอนต์แบบมีเชิงตามดีไซน์ */
  font-size: 42px;
  color: #000;
  margin-top: 0;
  margin-bottom: 25px;
  text-align: center;
}

.form-container {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* ปรับแต่ง Ion Input */
.custom-input {
  --background: transparent;
  --padding-start: 15px;
  --padding-end: 15px;
  --padding-top: 12px;
  --padding-bottom: 12px;
  --placeholder-color: #999;
  
  width: 100%;
  border: 1.5px solid #d4a3a3; /* สีขอบชมพูอ่อน */
  border-radius: 8px;
  margin-bottom: 12px;
  font-size: 14px;
}

/* ลบเส้นขอบล่างอัตโนมัติของ Ionic */
.custom-input::part(native) {
  padding: 0;
}

/* ปุ่ม Submit */
.submit-btn {
  background: #8b3c3c;
  color: white;
  font-size: 18px;
  font-weight: bold;
  letter-spacing: 1px;
  padding: 15px 40px;
  border: none;
  border-radius: 30px;
  margin-top: 20px;
  box-shadow: 0px 5px 10px rgba(0, 0, 0, 0.2);
  cursor: pointer;
  transition: transform 0.2s ease;
  width: 60%;
}

.submit-btn:active {
  transform: scale(0.95);
}

/* 1. สร้าง Container เพื่อคุมความกว้าง */
.mobile-wrapper {
  max-width: 430px; /* ความกว้างมาตรฐานของ iPhone 15 Pro Max */
  margin: 0 auto;   /* จัดกึ่งกลางหน้าจอ */
  position: relative;
  min-height: 100vh;
  background: #f5f5f5;
  overflow: hidden; /* กันส่วนโค้งล้นออกนอกจอ */
  box-shadow: 0 0 50px rgba(0,0,0,0.1); /* เพิ่มเงาด้านข้างให้ดูเป็นเลเยอร์มือถือเมื่อดูบนคอม */
}

/* 2. ปรับค่า z-index ของพื้นหลังให้ไม่กวนกัน */
.bg-shape-top, .bg-shape-bottom {
  position: absolute;
  z-index: 0;
}

/* 3. ปรับการวางตำแหน่ง Card */
.login-card, .register-card {
  position: relative;
  z-index: 2;
  margin: 12vh 20px 20px 20px; /* ลด Margin ด้านบนลงหน่อยให้สมดุล */
  /* ส่วนอื่นๆ คงเดิม */
}
</style>