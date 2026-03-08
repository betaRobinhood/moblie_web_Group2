import { db, auth } from './firebase';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';

/**
 * Fetches a user's profile from Firestore by UID.
 * Returns { success: true, data: {...} } or { success: false, data: null }
 * Used by the router navigation guard to check roles.
 */
export const getUserProfile = async (uid: string): Promise<{ success: boolean; data: any }> => {
  try {
    const docRef = doc(db, 'users', uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { success: true, data: docSnap.data() };
    }
    return { success: false, data: null };
  } catch (error) {
    console.error('getUserProfile error:', error);
    return { success: false, data: null };
  }
};

/**
 * Updates a user's profile in Firestore.
 */
export const updateUserProfile = async (uid: string, data: any): Promise<{ success: boolean; message: string }> => {
  try {
    const docRef = doc(db, 'users', uid);
    await updateDoc(docRef, data);
    return { success: true, message: 'Profile updated successfully' };
  } catch (error: any) {
    console.error('updateUserProfile error:', error);
    return { success: false, message: error.message || 'Failed to update profile' };
  }
};

/**
 * Registers a new user and creates their profile in Firestore.
 */
export const registerService = async (email: string, password: string, userData: any): Promise<{ success: boolean; message?: string }> => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    await setDoc(doc(db, 'users', user.uid), {
      ...userData,
      email,
      uid: user.uid,
      createdAt: new Date(),
      role: 'customer' // Default role
    });

    return { success: true };
  } catch (error: any) {
    console.error('registerService error:', error);
    return { success: false, message: error.message || 'Registration failed' };
  }
};