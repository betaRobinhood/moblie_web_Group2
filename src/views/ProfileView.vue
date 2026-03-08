<template>
  <ion-page>
    <ion-content :fullscreen="true" class="custom-bg">
      <div class="top-gradient">
        <div class="header-row">
          <ion-icon 
            :icon="arrowBackCircleOutline" 
            class="back-btn" 
            @click="router.push('/home')">
          </ion-icon>
          <h1 class="page-title">Profile</h1>
        </div>
      </div>

      <div class="profile-card">
        
        <div class="avatar-wrapper">
          <div class="avatar-outer">
            <div class="avatar-inner">
              <img :src="userStore.profile?.avatarUrl || ''" alt="" v-if="userStore.profile?.avatarUrl" />
            </div>
          </div>
        </div>

        <div class="form-container">
          
          <div class="input-group">
            <input type="text" v-model="profileData.username" placeholder="Username" class="custom-input" />
            <ion-icon :icon="pencil" class="edit-icon"></ion-icon>
          </div>

          <div class="input-group">
            <input type="text" v-model="profileData.firstName" placeholder="First name" class="custom-input" />
          </div>

          <div class="input-group">
            <input type="text" v-model="profileData.lastName" placeholder="Last name" class="custom-input" />
          </div>

          <div class="input-group">
            <input type="email" v-model="profileData.email" placeholder="Email" class="custom-input email-input" readonly />
          </div>

          <div class="input-group">
            <input type="tel" v-model="profileData.phone" placeholder="Phone number" class="custom-input" />
          </div>

          <div class="delete-account" @click="confirmDelete">
            <ion-icon :icon="trashOutline" class="trash-icon"></ion-icon>
            <span>Delete account</span>
          </div>

          <div class="action-buttons">
            <button class="save-btn" @click="saveProfile">SAVE</button>
            <button class="logout-btn" @click="confirmLogout">LOGOUT</button>
          </div>

        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { IonPage, IonContent, IonIcon, alertController } from '@ionic/vue';
import { arrowBackCircleOutline, pencil, trashOutline } from 'ionicons/icons';
import { useRouter } from 'vue-router';
import { useUserStore } from '../stores/userStore';
import { auth } from '../services/firebase';
import { signOut } from 'firebase/auth';
import { useI18n } from 'vue-i18n';

// 1. นำเข้าฟังก์ชันอัปเดตโปรไฟล์ที่เราเพิ่งสร้าง
import { updateUserProfile } from '../services/authService';

const router = useRouter();
const userStore = useUserStore();
const { t } = useI18n();

const profileData = ref({
  username: '',
  firstName: '',
  lastName: '',
  email: '',
  phone: ''
});

const loadProfileData = () => {
  if (userStore.profile) {
    profileData.value = {
      username: userStore.profile.username || '',
      firstName: userStore.profile.firstName || '',
      lastName: userStore.profile.lastName || '',
      email: userStore.profile.email || '',
      phone: userStore.profile.phone || ''
    };
  }
};

onMounted(() => {
  loadProfileData();
});

watch(() => userStore.profile, () => {
  loadProfileData();
});

// ==========================================
// ฟังก์ชันกดปุ่ม SAVE (บันทึกลง Firebase)
// ==========================================
const saveProfile = async () => {
  // ตรวจสอบก่อนว่ามี User ID ไหม
  if (!userStore.user?.uid) return;

  // เตรียมข้อมูลที่จะอัปเดต (ไม่เอา email ส่งไป เพราะเราไม่ให้แก้)
  const dataToUpdate = {
    username: profileData.value.username,
    firstName: profileData.value.firstName,
    lastName: profileData.value.lastName,
    phone: profileData.value.phone
  };

  // เรียกใช้ Service ยิงขึ้น Firebase
  const result = await updateUserProfile(userStore.user.uid, dataToUpdate);

  if (result.success) {
    // อัปเดตข้อมูลใน Store (Pinia) เพื่อให้หน้าจอแสดงผลใหม่ทันทีโดยไม่ต้องรีเฟรช
    if (userStore.profile) {
      userStore.profile.username = dataToUpdate.username;
      userStore.profile.firstName = dataToUpdate.firstName;
      userStore.profile.lastName = dataToUpdate.lastName;
      userStore.profile.phone = dataToUpdate.phone;
    }

    // แจ้งเตือนว่าสำเร็จ
    const alert = await alertController.create({
      header: 'Success',
      message: 'บันทึกข้อมูลโปรไฟล์เรียบร้อยแล้ว!',
      buttons: ['OK']
    });
    await alert.present();
  } else {
    // แจ้งเตือนเมื่อเกิด Error
    const alert = await alertController.create({
      header: 'Error',
      message: result.message,
      buttons: ['OK']
    });
    await alert.present();
  }
};

const confirmDelete = async () => {
  const alert = await alertController.create({
    header: 'Delete Account',
    message: 'Are you sure you want to delete your account? This action cannot be undone.',
    buttons: [
      { text: 'Cancel', role: 'cancel' },
      { 
        text: 'Delete', 
        role: 'destructive',
        handler: () => { console.log('Account deleted'); }
      }
    ]
  });
  await alert.present();
};

const confirmLogout = async () => {
  const alert = await alertController.create({
    header: t('common.logout') || 'Logout',
    message: t('auth.logout_confirm') || 'Are you sure you want to log out?',
    buttons: [
      { text: t('common.cancel') || 'Cancel', role: 'cancel' },
      { 
        text: t('common.logout') || 'Logout', 
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
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400&family=Itim&family=Joan&display=swap');

/* พื้นหลังหลัก */
.custom-bg {
  --background: #f5f5f5;
}

/* ================= Header & Gradient ================= */
.top-gradient {
  position: relative;
  width: 100%;
  height: 280px;
  background: linear-gradient(180deg, #9A4444 0%, #DD7631 100%);
  padding: 50px 20px 0 20px;
  z-index: 1;
}

.header-row {
  display: flex;
  align-items: center;
  position: relative;
}

.back-btn {
  font-size: 38px;
  color: white;
  cursor: pointer;
  position: absolute;
  left: 0;
  z-index: 10;
}

.page-title {
  width: 100%;
  text-align: center;
  font-family: 'Joan', serif;
  font-size: 54px; /* ปรับลดจาก 64px เล็กน้อยเพื่อให้พอดีจอมือถือ */
  color: #FFFFFF;
  margin: 0;
  font-weight: 400;
}

/* ================= White Card ================= */
.profile-card {
  position: relative;
  background: #FFFFFF;
  border-radius: 20px;
  margin: -60px 20px 20px 20px;
  padding: 0 20px 40px 20px;
  z-index: 2;
  box-shadow: 0px -2px 10px rgba(0,0,0,0.05);
}

/* ================= Avatar ================= */
.avatar-wrapper {
  display: flex;
  justify-content: center;
  margin-top: -70px; /* ดึงรูปขึ้นไปครึ่งนึง */
  margin-bottom: 30px;
}

.avatar-outer {
  width: 140px;
  height: 140px;
  background: #FFFFFF;
  border-radius: 50%;
  box-shadow: 0px 5px 4px 2px rgba(0, 0, 0, 0.25);
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-inner {
  width: 110px;
  height: 110px;
  background: #F5F5F5;
  border-radius: 50%;
  box-shadow: inset 0px 6px 6px rgba(0, 0, 0, 0.25);
  overflow: hidden;
}

.avatar-inner img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* ================= Form & Inputs ================= */
.form-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.input-group {
  position: relative;
  width: 100%;
  max-width: 317px;
}

.custom-input {
  width: 100%;
  height: 48px;
  background: #FFFFFF;
  border: 2px solid rgba(154, 68, 68, 0.5);
  border-radius: 10px;
  padding: 0 15px;
  font-family: 'Inter', sans-serif;
  font-size: 18px;
  color: rgba(0, 0, 0, 0.75);
  outline: none;
}

.custom-input:focus {
  border-color: #9A4444;
}

.email-input {
  text-decoration: underline;
}

.edit-icon {
  position: absolute;
  right: 15px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 18px;
  color: #000;
}

/* ================= Delete Account ================= */
.delete-account {
  width: 100%;
  max-width: 317px;
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 10px;
  cursor: pointer;
}

.trash-icon {
  font-size: 18px;
  color: #000;
}

.delete-account span {
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  color: #000000;
}

/* ================= Buttons ================= */
.action-buttons {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
  margin-top: 30px;
  width: 100%;
}

.save-btn {
  width: 210px;
  height: 48px;
  background: #9A4444;
  border-radius: 30px;
  font-family: 'Itim', cursive;
  font-size: 24px;
  color: #FFFFFF;
  border: none;
  box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.25);
  cursor: pointer;
  transition: transform 0.1s;
}

.logout-btn {
  width: 210px;
  height: 49px;
  background: #000000;
  border-radius: 45px;
  font-family: 'Itim', cursive;
  font-size: 24px;
  color: #FFFFFF;
  border: none;
  box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.25);
  cursor: pointer;
  transition: transform 0.1s;
}

.save-btn:active, .logout-btn:active {
  transform: scale(0.95);
}
</style>