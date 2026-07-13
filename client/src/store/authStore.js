import { create } from 'zustand';
import { auth, db } from '../services/firebase';
import { signOut as firebaseSignOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

export const useAuthStore = create((set, get) => ({
  session: null,
  user: null,
  isAdmin: false,
  isLoading: true,
  error: null,
  setSession: async (firebaseUser) => {
    if (!firebaseUser) {
      set({ session: null, user: null, isAdmin: false, isLoading: false });
      return;
    }

    const sessionUser = {
      id: firebaseUser.uid,
      email: firebaseUser.email,
    };

    set({
      session: { user: sessionUser },
      user: firebaseUser,
      isLoading: true,
      error: null,
    });

    try {
      const isUserAdmin = await get().checkAdminStatus(firebaseUser.uid);
      set({ isAdmin: isUserAdmin, isLoading: false });
    } catch {
      set({ isAdmin: false, isLoading: false });
    }
  },
  checkAdminStatus: async (userId) => {
    try {
      const docRef = doc(db, 'admins', userId);
      const docSnap = await getDoc(docRef);
      return docSnap.exists();
    } catch (e) {
      console.warn('[AuthStore] Direct Firebase admin verification failed:', e);
      return false;
    }
  },
  forceRefreshAdminStatus: async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    set({ isLoading: true });
    try {
      const isUserAdmin = await get().checkAdminStatus(currentUser.uid);
      set({ isAdmin: isUserAdmin, isLoading: false });
    } catch {
      set({ isAdmin: false, isLoading: false });
    }
  },
  signOut: async () => {
    set({ isLoading: true });
    try {
      await firebaseSignOut(auth);
    } catch (e) {
      console.error('Sign out error:', e);
    }
    set({ session: null, user: null, isAdmin: false, isLoading: false, error: null });
  },
}));
