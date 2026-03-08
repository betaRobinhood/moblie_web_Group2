import { defineStore } from 'pinia';
import { auth, db } from '../services/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

export const useUserStore = defineStore('user', {
    state: () => ({
        user: null as any,
        profile: null as any,
        loading: true,
        language: 'en'
    }),
    actions: {
        async fetchProfile(uid: string) {
            const docRef = doc(db, 'users', uid);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                this.profile = docSnap.data();
                this.language = this.profile.language || 'en';
            }
        },
        async setLanguage(lang: string) {
            if (this.user) {
                this.language = lang;
                await updateDoc(doc(db, 'users', this.user.uid), { language: lang });
            }
        },
        initialize() {
            onAuthStateChanged(auth, async (user) => {
                this.user = user;
                if (user) {
                    await this.fetchProfile(user.uid);
                } else {
                    this.profile = null;
                }
                this.loading = false;
            });
        }
    }
});
