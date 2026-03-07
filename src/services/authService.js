// src/services/authService.js

import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut 
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore"; 
import { auth, db } from "../firebase"; 

// ==========================================
// 1. ฟังก์ชันเข้าสู่ระบบ (Login)
// ==========================================
export const loginService = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    console.log("ล็อกอินสำเร็จ! User ID:", user.uid);
    
    return { success: true, user };
  } catch (error) {
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
export const registerService = async (email, password, userData) => {
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

  } catch (error) {
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
export const logoutService = async () => {
  try {
    await signOut(auth);
    console.log("ออกจากระบบสำเร็จ");
    return { success: true };
  } catch (error) {
    console.error("Logout Error:", error);
    return { success: false, message: "เกิดข้อผิดพลาดในการออกจากระบบ" };
  }
};

// ==========================================
// 4. ฟังก์ชันดึงข้อมูลโปรไฟล์ผู้ใช้ (Get User Profile)
// ==========================================
export const getUserProfile = async (uid) => {
  try {
    const userDocRef = doc(db, "users", uid);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      return { success: true, data: userDoc.data() };
    } else {
      return { success: false, message: "ไม่พบข้อมูลผู้ใช้งานในระบบ" };
    }
  } catch (error) {
    console.error("Get Profile Error:", error);
    return { success: false, message: "ดึงข้อมูลโปรไฟล์ไม่สำเร็จ" };
  }
};