import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User as FirebaseUser,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, googleProvider, db } from './firebase';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role?: 'admin' | 'vip' | 'user' | string;
  createdAt?: any;
}

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userProfile: UserProfile | null;
  loading: boolean;
  isVip: boolean;
  isAdmin: boolean;
  hasDownloadPrivilege: boolean;
  loginWithGoogle: () => Promise<boolean>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Function to fetch Firestore user doc
  const fetchUserProfile = async (user: FirebaseUser) => {
    try {
      // Fetch user profile from the shared `users` collection
      const userDocRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userDocRef);

      if (userSnap.exists()) {
        const data = userSnap.data() as Partial<UserProfile>;
        setUserProfile({
          uid: user.uid,
          email: user.email || data.email || '',
          displayName: user.displayName || data.displayName || 'User',
          photoURL: user.photoURL || data.photoURL,
          role: data.role || 'user',
          createdAt: data.createdAt,
        });
      } else {
        // In case doc doesn't exist yet, fallback to auth user info with default role
        setUserProfile({
          uid: user.uid,
          email: user.email || '',
          displayName: user.displayName || 'User',
          photoURL: user.photoURL || undefined,
          role: 'user',
        });
      }
    } catch (error) {
      console.warn('[AuthProvider] Could not fetch user doc from Firestore:', error);
      // Fallback
      setUserProfile({
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || 'User',
        photoURL: user.photoURL || undefined,
        role: 'user',
      });
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        await fetchUserProfile(user);
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async (): Promise<boolean> => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) {
        await fetchUserProfile(result.user);
        return true;
      }
      return false;
    } catch (error: any) {
      const errorCode = error?.code || '';
      // If user voluntarily closed or cancelled the popup, do not treat as an application error
      if (errorCode === 'auth/popup-closed-by-user' || errorCode === 'auth/cancelled-popup-request') {
        // User deliberately dismissed the login window
        return false;
      }

      if (errorCode === 'auth/popup-blocked') {
        alert('Trình duyệt đang chặn cửa sổ đăng nhập. Vui lòng cho phép bật popup trên trình duyệt của bạn.');
        return false;
      }

      console.warn('[AuthProvider] Đăng nhập Google không hoàn tất:', error?.message || error);
      alert('Đăng nhập không thành công: ' + (error?.message || 'Lỗi xác thực'));
      return false;
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
    if (currentUser) {
      await fetchUserProfile(currentUser);
    }
  };

  const role = userProfile?.role?.toLowerCase();
  const isAdmin = role === 'admin';
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
        loginWithGoogle,
        logout,
        refreshProfile,
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
