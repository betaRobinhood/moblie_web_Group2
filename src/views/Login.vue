<template>
  <ion-page>
    <ion-content :fullscreen="true" class="custom-background">
      <div class="bg-shape-top"></div>
      <div class="bg-shape-bottom"></div>

      <div class="login-card">
        <h1 class="title">LOGIN</h1>

        <form @submit.prevent="handleLogin" class="form-container">
          <ion-input class="custom-input" placeholder="Username" type="text"></ion-input>

          <div class="input-wrapper">
            <ion-input class="custom-input password-input" placeholder="Password" type="password"></ion-input>
            <ion-icon :icon="lockClosedOutline" class="input-icon"></ion-icon>
          </div>

          <button type="submit" class="submit-btn">LOGIN</button>

          <hr class="divider" />

          <div class="links-container">
            <a href="/register" class="link">create new account</a>
            <a href="#" class="link">forget password</a>
          </div>
        </form>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { IonPage, IonContent, IonInput, IonIcon } from '@ionic/vue';
import { lockClosedOutline } from 'ionicons/icons'; // Import ไอคอนแม่กุญแจ

const handleLogin = () => {
  console.log('Login submitted!');
  // ใส่ Logic สำหรับการล็อกอินที่นี่
};
</script>

<style scoped>
/* พื้นหลังของหน้าจอ */
.custom-background {
  --background: #f5f5f5;
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
.login-card {
  position: relative;
  z-index: 10;
  background: white;
  margin: 15vh 20px 20px 20px;
  padding: 40px 20px;
  border-radius: 15px;
  box-shadow: 0px 8px 20px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* หัวข้อ LOGIN */
.title {
  font-family: 'Times New Roman', Times, serif;
  font-size: 42px;
  color: #1a0f0f;
  margin-top: 0;
  margin-bottom: 30px;
  text-align: center;
}

.form-container {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* ปรับแต่ง Ion Input พื้นฐาน */
.custom-input {
  --background: transparent;
  --padding-start: 15px;
  --padding-end: 15px;
  --padding-top: 14px;
  --padding-bottom: 14px;
  --placeholder-color: #888;
  
  width: 100%;
  border: 1.5px solid #d4a3a3;
  border-radius: 8px;
  margin-bottom: 15px;
  font-size: 15px;
}

.custom-input::part(native) {
  padding: 0;
}

/* Wrapper สำหรับช่องรหัสผ่านที่มีไอคอน */
.input-wrapper {
  position: relative;
  width: 100%;
}

.password-input {
  --padding-end: 45px; /* เผื่อพื้นที่ด้านขวาไม่ให้ตัวอักษรทับไอคอน */
}

/* ไอคอนแม่กุญแจ */
.input-icon {
  position: absolute;
  right: 15px;
  top: 42%;
  transform: translateY(-50%);
  font-size: 20px;
  color: #777;
  z-index: 2;
}

/* ปุ่ม Login */
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

/* เส้นคั่นสีแดงเข้ม */
.divider {
  width: 100%;
  height: 3px;
  background-color: #8b3c3c;
  border: none;
  margin: 35px 0 15px 0;
}

/* กล่องครอบลิงก์ด้านล่าง */
.links-container {
  width: 100%;
  display: flex;
  justify-content: space-between;
  padding: 0 5px;
}

/* ลิงก์ create new account / forget password */
.link {
  font-size: 13px;
  color: #a45a5a;
  text-decoration: none;
  transition: color 0.2s;
}

.link:hover {
  color: #8b3c3c;
  text-decoration: underline;
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