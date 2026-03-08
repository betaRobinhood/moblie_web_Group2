// src/services/authService.ts

import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  User 
} from "firebase/auth";
import { doc, setDoc, getDoc, DocumentData, updateDoc } from "firebase/firestore"; 
import { auth, db } from "../services/firebase"; 

// ==========================================
// กำหนดโครงสร้างข้อมูล (Interfaces)
// ==========================================

// โครงสร้างข้อมูลตอนสมัครสมาชิก
export interface UserRegistrationData {
  username: string;
  firstName: string;
  lastName: string;
  phone: string;
}

// โครงสร้างข้อมูลที่ส่งกลับเมื่อ Login/Register เสร็จ
export interface AuthResponse {
  success: boolean;
  user?: User;
  message?: string;
}

// โครงสร้างข้อมูลที่ส่งกลับเมื่อดึง Profile
export interface ProfileResponse {
  success: boolean;
  data?: DocumentData;
  message?: string;
}

// ==========================================
// 1. ฟังก์ชันเข้าสู่ระบบ (Login)
// ==========================================
export const loginService = async (email: string, password: string): Promise<AuthResponse> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    console.log("ล็อกอินสำเร็จ! User ID:", user.uid);
    
    return { success: true, user };
  } catch (error: any) {
    let errorMessage = "เกิดข้อผิดพลาดในการเข้าสู่ระบบ";
    if (error.code === 'auth/invalid-credential') errorMessage = "อีเมลหรือรหัสผ่านไม่ถูกต้อง";
    if (error.code === 'auth/user-not-found') errorMessage = "ไม่พบบัญชีผู้ใช้นี้";
    if (error.code === 'auth/wrong-password') errorMessage = "รหัสผ่านไม่ถูกต้อง";
    if (error.code === 'auth/invalid-email') errorMessage = "รูปแบบอีเมลไม่ถูกต้อง";
    
    console.error("Login Error:", error.code);
    return { success: false, message: errorMessage };
  }
};

// ==========================================
// 2. ฟังก์ชันสมัครสมาชิก (Register)
// ==========================================
export const registerService = async (email: string, password: string, userData: UserRegistrationData): Promise<AuthResponse> => {
  try {
    // สร้างบัญชีใน Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // บันทึกข้อมูลส่วนตัวลง Firestore
    await setDoc(doc(db, "users", user.uid), {
      username: userData.username,
      firstName: userData.firstName,
      lastName: userData.lastName,
      phone: userData.phone,
      email: email, 
      role: "user", 
      createdAt: new Date()
    });

    console.log("สมัครสมาชิกสำเร็จ! User ID:", user.uid);
    return { success: true, user };

  } catch (error: any) {
    let errorMessage = "เกิดข้อผิดพลาดในการสมัครสมาชิก";
    if (error.code === 'auth/email-already-in-use') errorMessage = "อีเมลนี้ถูกใช้งานแล้ว กรุณาใช้อีเมลอื่น";
    if (error.code === 'auth/weak-password') errorMessage = "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร";
    if (error.code === 'auth/invalid-email') errorMessage = "รูปแบบอีเมลไม่ถูกต้อง";
    
    console.error("Register Error:", error.code);
    return { success: false, message: errorMessage };
  }
};

// ==========================================
// 3. ฟังก์ชันออกจากระบบ (Logout)
// ==========================================
export const logoutService = async (): Promise<{ success: boolean; message?: string }> => {
  try {
    await signOut(auth);
    console.log("ออกจากระบบสำเร็จ");
    return { success: true };
  } catch (error: any) {
    console.error("Logout Error:", error);
    return { success: false, message: "เกิดข้อผิดพลาดในการออกจากระบบ" };
  }
};

// ==========================================
// 4. ฟังก์ชันดึงข้อมูลโปรไฟล์ผู้ใช้ (Get User Profile)
// ==========================================
export const getUserProfile = async (uid: string): Promise<ProfileResponse> => {
  try {
    const userDocRef = doc(db, "users", uid);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      return { success: true, data: userDoc.data() };
    } else {
      return { success: false, message: "ไม่พบข้อมูลผู้ใช้งานในระบบ" };
    }
  } catch (error: any) {
    console.error("Get Profile Error:", error);
    return { success: false, message: "ดึงข้อมูลโปรไฟล์ไม่สำเร็จ" };
  }
};

// ==========================================
// 5. ฟังก์ชันอัปเดตข้อมูลโปรไฟล์ (Update User Profile)
// ==========================================
export const updateUserProfile = async (uid: string, updateData: any): Promise<{ success: boolean; message?: string }> => {
  try {
    const userDocRef = doc(db, "users", uid);
    await updateDoc(userDocRef, updateData); // อัปเดตเฉพาะฟิลด์ที่ส่งไป
    console.log("อัปเดตข้อมูลโปรไฟล์สำเร็จ!");
    return { success: true };
  } catch (error: any) {
    console.error("Update Profile Error:", error);
    return { success: false, message: "อัปเดตข้อมูลไม่สำเร็จ กรุณาลองใหม่อีกครั้ง" };
  }
};