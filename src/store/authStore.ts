import { create } from 'zustand';
import { auth, db } from '@/services/firebase';
import { User, signOut as firebaseSignOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

interface SessionUser {
  id: string;
  email: string | null;
}

interface AuthState {
  session: { user: SessionUser } | null;
  user: User | null;
  isAdmin: boolean;
  isLoading: boolean;
  error: string | null;
  setSession: (user: User | null) => Promise<void>;
  checkAdminStatus: (userId: string) => Promise<boolean>;
  forceRefreshAdminStatus: () => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
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

    const sessionUser: SessionUser = {
      id: firebaseUser.uid,
      email: firebaseUser.email,
    };

    // Set the user as logged in immediately but keep isLoading true
    // until admin check completes. Do NOT reset isAdmin here — that
    // causes a momentary false value that triggers premature redirects.
    set({
      session: { user: sessionUser },
      user: firebaseUser,
      isLoading: true,
      error: null,
    });

    try {
      // Check if this user is also an admin (non-admins stay as customers)
      const isUserAdmin = await get().checkAdminStatus(firebaseUser.uid);
      set({ isAdmin: isUserAdmin, isLoading: false });
    } catch {
      // Even if the admin check fails, keep the user logged in as a customer
      set({ isAdmin: false, isLoading: false });
    }
  },
  checkAdminStatus: async (userId) => {
    try {
      // Force the auth token to be available before querying Firestore.
      // Without this, the Firestore SDK may not have the auth token ready
      // (especially on app startup from cached persistence), causing
      // permission-denied errors on rules that require signedIn().
      const currentUser = auth.currentUser;
      if (currentUser) {
        await currentUser.getIdToken(true);
      }

      const docRef = doc(db, 'admins', userId);
      const docSnap = await getDoc(docRef);
      const exists = docSnap.exists();
      if (exists) {
        console.log('[AuthStore] Admin status confirmed for user:', userId);
      }
      return exists;
    } catch (e) {
      const code = (e as { code?: string }).code;
      console.warn('[AuthStore] Admin check failed:', code || e);

      // If permission-denied, retry once after a short delay.
      // This handles the race where Firestore hasn't received the auth token yet.
      if (code === 'permission-denied') {
        try {
          await new Promise((resolve) => setTimeout(resolve, 1500));
          const currentUser = auth.currentUser;
          if (currentUser) {
            await currentUser.getIdToken(true);
          }
          const docRef = doc(db, 'admins', userId);
          const docSnap = await getDoc(docRef);
          const exists = docSnap.exists();
          if (exists) {
            console.log('[AuthStore] Admin status confirmed on retry for user:', userId);
          }
          return exists;
        } catch (retryErr) {
          console.warn('[AuthStore] Admin check retry also failed:', retryErr);
          return false;
        }
      }

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
