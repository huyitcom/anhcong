import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User as FirebaseUser,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  serverTimestamp,
  increment,
  addDoc,
  collection,
} from 'firebase/firestore';
import { auth, googleProvider, db } from './firebase';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role?: 'admin' | 'vip' | 'user' | string;
  credits: number;
  totalRendered: number;
  createdAt?: any;
  updatedAt?: any;
}

export interface TopupRequest {
  id?: string;
  userId: string;
  userEmail: string;
  userName: string;
  packageName: string;
  creditsAmount: number;
  amountVnd: number;
  transferCode: string;
  status: 'pending' | 'completed' | 'cancelled';
  createdAt?: any;
  notes?: string;
}

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userProfile: UserProfile | null;
  loading: boolean;
  isVip: boolean;
  isAdmin: boolean;
  hasDownloadPrivilege: boolean;
  authError: string | null;
  clearAuthError: () => void;
  loginWithGoogle: () => Promise<UserProfile | null>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  consumeCredits: (amount: number, resolution: '1K' | '2K' | '4K', templateName: string) => Promise<boolean>;
  adminAddCredits: (targetUid: string, amount: number) => Promise<boolean>;
  adminSetRole: (targetUid: string, newRole: string) => Promise<boolean>;
  submitTopupRequest: (
    packageName: string,
    creditsAmount: number,
    amountVnd: number,
    transferCode: string
  ) => Promise<boolean>;
  claimPayosCredits: (
    orderCode: number,
    creditsAmount: number,
    amountVnd: number,
    packageName: string
  ) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ADMIN_EMAILS = ['huyitcom@gmail.com'];
const INITIAL_FREE_CREDITS = 3;

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Sync / create profile in Firestore and subscribe to real-time updates
  useEffect(() => {
    let unsubscribeDoc: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);

      if (unsubscribeDoc) {
        unsubscribeDoc();
        unsubscribeDoc = null;
      }

      if (user) {
        const isSuperAdmin = ADMIN_EMAILS.includes((user.email || '').toLowerCase());
        const userDocRef = doc(db, 'users', user.uid);

        try {
          const userSnap = await getDoc(userDocRef);

          if (userSnap.exists()) {
            const data = userSnap.data();
            const updates: Record<string, any> = {};

            // If existing user has no credits defined, grant initial free credits
            if (typeof data.credits !== 'number') {
              updates.credits = INITIAL_FREE_CREDITS;
              updates.totalRendered = data.totalRendered || 0;
            }

            // Sync super admin role
            if (isSuperAdmin && data.role !== 'admin') {
              updates.role = 'admin';
            }

            // Sync photo or display name if missing
            if (!data.photoURL && user.photoURL) {
              updates.photoURL = user.photoURL;
            }
            if (!data.displayName && user.displayName) {
              updates.displayName = user.displayName;
            }

            if (Object.keys(updates).length > 0) {
              await setDoc(userDocRef, updates, { merge: true });
            }
          } else {
            // New user registration: grant initial 3 free credits
            const newUserData = {
              uid: user.uid,
              email: user.email || '',
              displayName: user.displayName || user.email?.split('@')[0] || 'User',
              photoURL: user.photoURL || '',
              role: isSuperAdmin ? 'admin' : 'user',
              credits: INITIAL_FREE_CREDITS,
              totalRendered: 0,
              createdAt: serverTimestamp(),
            };
            await setDoc(userDocRef, newUserData, { merge: true });
          }
        } catch (err) {
          console.warn('[AuthProvider] Error setting up initial user doc:', err);
        }

        // Subscribe to real-time updates so UI reacts instantly to credit/role changes
        unsubscribeDoc = onSnapshot(
          userDocRef,
          (snapshot) => {
            if (snapshot.exists()) {
              const data = snapshot.data();
              const role = isSuperAdmin ? 'admin' : data.role || 'user';
              setUserProfile({
                uid: user.uid,
                email: user.email || data.email || '',
                displayName: user.displayName || data.displayName || 'User',
                photoURL: user.photoURL || data.photoURL,
                role: role,
                credits: typeof data.credits === 'number' ? data.credits : INITIAL_FREE_CREDITS,
                totalRendered: typeof data.totalRendered === 'number' ? data.totalRendered : 0,
                createdAt: data.createdAt,
                updatedAt: data.updatedAt,
              });
            } else {
              setUserProfile({
                uid: user.uid,
                email: user.email || '',
                displayName: user.displayName || 'User',
                photoURL: user.photoURL || undefined,
                role: isSuperAdmin ? 'admin' : 'user',
                credits: INITIAL_FREE_CREDITS,
                totalRendered: 0,
              });
            }
            setLoading(false);
          },
          (err) => {
            console.error('[AuthProvider] onSnapshot error:', err);
            setLoading(false);
          }
        );
      } else {
        setUserProfile(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeDoc) unsubscribeDoc();
    };
  }, []);

  const clearAuthError = () => setAuthError(null);

  const loginWithGoogle = async (): Promise<UserProfile | null> => {
    setAuthError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) {
        const u = result.user;
        const isSuperAdmin = ADMIN_EMAILS.includes((u.email || '').toLowerCase());
        let credits = INITIAL_FREE_CREDITS;
        let role: 'user' | 'vip' | 'admin' = isSuperAdmin ? 'admin' : 'user';
        try {
          const userSnap = await getDoc(doc(db, 'users', u.uid));
          if (userSnap.exists()) {
            const data = userSnap.data();
            credits = typeof data.credits === 'number' ? data.credits : INITIAL_FREE_CREDITS;
            role = isSuperAdmin ? 'admin' : data.role || 'user';
          }
        } catch (e) {
          console.warn('[AuthProvider] login getDoc fallback:', e);
        }
        const profile: UserProfile = {
          uid: u.uid,
          email: u.email || '',
          displayName: u.displayName || u.email?.split('@')[0] || 'User',
          photoURL: u.photoURL || undefined,
          role,
          credits,
          totalRendered: 0,
        };
        setCurrentUser(u);
        setUserProfile(profile);
        return profile;
      }
      return null;
    } catch (error: any) {
      const errorCode = error?.code || '';
      if (errorCode === 'auth/popup-closed-by-user' || errorCode === 'auth/cancelled-popup-request') {
        return null;
      }
      if (errorCode === 'auth/popup-blocked') {
        const msg = 'Trình duyệt đang chặn cửa sổ đăng nhập Google. Vui lòng bật popup cho trang web này để đăng nhập.';
        setAuthError(msg);
        console.warn('[AuthProvider] ' + msg);
        return null;
      }
      const msg = 'Đăng nhập Google không hoàn tất: ' + (error?.message || 'Lỗi xác thực');
      console.warn('[AuthProvider]', error);
      setAuthError(msg);
      return null;
    }
  };

  const logout = async () => {
    try {
      await firebaseSignOut(auth);
      setCurrentUser(null);
      setUserProfile(null);
    } catch (error) {
      console.error('[AuthProvider] Error signing out:', error);
    }
  };

  const refreshProfile = async () => {
    if (!currentUser) return;
    try {
      const snap = await getDoc(doc(db, 'users', currentUser.uid));
      if (snap.exists()) {
        const data = snap.data();
        setUserProfile((prev) => (prev ? { ...prev, ...data } : null));
      }
    } catch (e) {
      console.error('[AuthProvider] refreshProfile error:', e);
    }
  };

  // Deduct credits after a successful render and log it
  const consumeCredits = async (
    amount: number,
    resolution: '1K' | '2K' | '4K',
    templateName: string
  ): Promise<boolean> => {
    if (!currentUser) return false;
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        credits: increment(-amount),
        totalRendered: increment(1),
        updatedAt: serverTimestamp(),
      });

      // Log render to renderLogs collection
      try {
        await addDoc(collection(db, 'renderLogs'), {
          userId: currentUser.uid,
          userEmail: currentUser.email || '',
          userName: currentUser.displayName || 'User',
          resolution,
          creditsDeducted: amount,
          templateName,
          timestamp: new Date().toISOString(),
          status: 'success',
        });
      } catch (logErr) {
        console.warn('[AuthProvider] Non-blocking render log error:', logErr);
      }

      return true;
    } catch (err) {
      console.error('[AuthProvider] consumeCredits error:', err);
      return false;
    }
  };

  // Admin function: Add / adjust credits for any user
  const adminAddCredits = async (targetUid: string, amount: number): Promise<boolean> => {
    try {
      const targetRef = doc(db, 'users', targetUid);
      await updateDoc(targetRef, {
        credits: increment(amount),
        updatedAt: serverTimestamp(),
      });
      return true;
    } catch (err) {
      console.error('[AuthProvider] adminAddCredits error:', err);
      return false;
    }
  };

  // Admin function: Set user role (admin | vip | user)
  const adminSetRole = async (targetUid: string, newRole: string): Promise<boolean> => {
    try {
      const targetRef = doc(db, 'users', targetUid);
      await updateDoc(targetRef, {
        role: newRole,
        updatedAt: serverTimestamp(),
      });
      return true;
    } catch (err) {
      console.error('[AuthProvider] adminSetRole error:', err);
      return false;
    }
  };

  // User submits a top-up request after initiating bank transfer
  const submitTopupRequest = async (
    packageName: string,
    creditsAmount: number,
    amountVnd: number,
    transferCode: string
  ): Promise<boolean> => {
    if (!currentUser) return false;
    try {
      await addDoc(collection(db, 'topupRequests'), {
        userId: currentUser.uid,
        userEmail: currentUser.email || '',
        userName: currentUser.displayName || 'Khách hàng',
        packageName,
        creditsAmount,
        amountVnd,
        transferCode,
        status: 'pending',
        createdAt: serverTimestamp(),
      });
      return true;
    } catch (err) {
      console.error('[AuthProvider] submitTopupRequest error:', err);
      return false;
    }
  };

  // Credit user account automatically after PayOS payment is verified
  const claimPayosCredits = async (
    orderCode: number,
    creditsAmount: number,
    amountVnd: number,
    packageName: string
  ): Promise<boolean> => {
    if (!currentUser) return false;
    try {
      const orderRef = doc(db, 'payosOrders', String(orderCode));
      try {
        const orderSnap = await getDoc(orderRef);
        if (orderSnap.exists() && orderSnap.data().claimed) {
          console.log(`[AuthProvider] PayOS order ${orderCode} was already claimed.`);
          return true;
        }
      } catch (checkErr) {
        console.warn('[AuthProvider] Order check skipped:', checkErr);
      }

      // Mark order as claimed in payosOrders collection
      try {
        await setDoc(
          orderRef,
          {
            orderCode,
            userId: currentUser.uid,
            userEmail: currentUser.email || '',
            packageName,
            creditsAmount,
            amountVnd,
            status: 'PAID',
            claimed: true,
            paidAt: serverTimestamp(),
          },
          { merge: true }
        );
      } catch (orderWriteErr) {
        console.warn('[AuthProvider] Non-blocking payosOrders write error:', orderWriteErr);
      }

      // Increment credits on user doc
      const userDocRef = doc(db, 'users', currentUser.uid);
      await setDoc(
        userDocRef,
        {
          uid: currentUser.uid,
          email: currentUser.email || '',
          displayName: currentUser.displayName || currentUser.email?.split('@')[0] || 'User',
          credits: increment(creditsAmount),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      // Local state immediate refresh
      setUserProfile((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          credits: (prev.credits ?? 0) + creditsAmount,
        };
      });

      console.log(`[AuthProvider] Successfully credited +${creditsAmount} to ${currentUser.uid}`);
      return true;
    } catch (err: any) {
      console.error('[AuthProvider] claimPayosCredits error:', err);
      // Even if firestore error, optimistic update local profile
      setUserProfile((prev) => (prev ? { ...prev, credits: (prev.credits ?? 0) + creditsAmount } : null));
      return false;
    }
  };

  const role = userProfile?.role?.toLowerCase();
  const isAdmin = role === 'admin' || (currentUser?.email && ADMIN_EMAILS.includes(currentUser.email.toLowerCase())) || false;
  const isVip = role === 'vip' || isAdmin;
  const hasDownloadPrivilege = isVip || isAdmin;

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        loading,
        isVip,
        isAdmin,
        hasDownloadPrivilege,
        authError,
        clearAuthError,
        loginWithGoogle,
        logout,
        refreshProfile,
        consumeCredits,
        adminAddCredits,
        adminSetRole,
        submitTopupRequest,
        claimPayosCredits,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
