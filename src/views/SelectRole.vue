<template>
  <ion-page>
    <ion-content :fullscreen="true" class="ion-no-padding">
      <div class="full-screen-container">
        <div class="full-bg-gradient"></div>

        <div class="role-card">
          <h2 class="title">Please select your role</h2>

          <div class="form-container">
            <div class="select-wrapper">
              <ion-select 
                interface="popover" 
                placeholder="User" 
                :toggle-icon="caretDownSharp" 
                class="custom-select"
                v-model="selectedRole"
              >
                <ion-select-option value="user">User</ion-select-option>
                <ion-select-option value="owner">Owner</ion-select-option>
              </ion-select>
            </div>

            <button @click="handleGetStarted" class="submit-btn">
              Get Started
            </button>
          </div>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { ref } from 'vue';
import { IonPage, IonContent, IonSelect, IonSelectOption } from '@ionic/vue';
import { caretDownSharp } from 'ionicons/icons';

const selectedRole = ref('user');

const handleGetStarted = () => {
  console.log('Role Selected:', selectedRole.value);
};
</script>

<style>
.full-screen-container {
  width: 100%;
  min-height: 100vh;
  display: flex;
  align-items: center; 
  justify-content: center;
  position: relative;
}

.full-bg-gradient {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(180deg, #8b3c3c 0%, #1a0f0f 100%);
  z-index: 0;
}

.role-card {
  position: relative;
  z-index: 10;
  background: white;
  width: 90%;
  max-width: 500px;
  padding: 50px 30px;
  border-radius: 20px;
  box-shadow: 0px 10px 40px rgba(0, 0, 0, 0.6);
  text-align: center;
}

.title {
  color: #1a1a1a;
  font-size: 22px;
  font-weight: 500;
  margin-bottom: 35px;
}

.form-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 30px;
}

.select-wrapper {
  width: 100%;
  position: relative;
}

.custom-select {
  --background: white;
  width: 100%;
  min-height: 55px;
  border: 1.5px solid #333;
  border-radius: 12px;
  padding-inline-start: 9px;
  padding-inline-end: 9px; 
  font-size: 18px;
  position: relative;
}

.custom-select::part(container) {
  border-bottom: none;
}

.custom-select::part(icon) {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  color: #8b3c3c;
  opacity: 1;
  font-size: 40px;
  pointer-events: none;
}

.custom-select::part(text) {
  text-align: left;
}

.submit-btn {
  background: #a45a5a;
  color: white;
  padding: 14px 45px;
  border: none;
  border-radius: 12px;
  box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.3); /* ใส่เงาตามรูป */
  cursor: pointer;
}
</style>