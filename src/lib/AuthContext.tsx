import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User as FirebaseUser,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
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
  loginWithGoogle: () => Promise<UserProfile | null>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Function to fetch Firestore user doc
  const fetchUserProfile = async (user: FirebaseUser): Promise<UserProfile> => {
    let profile: UserProfile;
    try {
      // Fetch user profile from the shared `users` collection
      const userDocRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userDocRef);

      if (userSnap.exists()) {
        const data = userSnap.data() as Partial<UserProfile>;
        profile = {
          uid: user.uid,
          email: user.email || data.email || '',
          displayName: user.displayName || data.displayName || 'User',
          photoURL: user.photoURL || data.photoURL,
          role: data.role || 'user',
          createdAt: data.createdAt,
        };

        // Sync photo or displayName if missing in Firestore doc
        if ((!data.photoURL && user.photoURL) || (!data.displayName && user.displayName)) {
          setDoc(
            userDocRef,
            {
              displayName: user.displayName || data.displayName || 'User',
              photoURL: user.photoURL || data.photoURL || '',
            },
            { merge: true }
          ).catch((e) => console.warn('[AuthProvider] Sync profile warning:', e));
        }
      } else {
        // Document does not exist yet -> Create new user doc in Firestore
        const newUserData = {
          uid: user.uid,
          email: user.email || '',
          displayName: user.displayName || user.email?.split('@')[0] || 'User',
          photoURL: user.photoURL || '',
          role: 'user',
          createdAt: serverTimestamp(),
        };

        try {
          await setDoc(userDocRef, newUserData, { merge: true });
        } catch (saveErr) {
          console.error('[AuthProvider] Không thể tạo user mới trên Firestore:', saveErr);
        }

        profile = {
          uid: user.uid,
          email: user.email || '',
          displayName: user.displayName || user.email?.split('@')[0] || 'User',
          photoURL: user.photoURL || undefined,
          role: 'user',
          createdAt: new Date().toISOString(),
        };
      }
    } catch (error) {
      console.warn('[AuthProvider] Could not fetch user doc from Firestore:', error);
      // Fallback
      profile = {
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || 'User',
        photoURL: user.photoURL || undefined,
        role: 'user',
      };
    }
    setUserProfile(profile);
    return profile;
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

  const loginWithGoogle = async (): Promise<UserProfile | null> => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) {
        const profile = await fetchUserProfile(result.user);
        return profile;
      }
      return null;
    } catch (error: any) {
      const errorCode = error?.code || '';
      // If user voluntarily closed or cancelled the popup, do not treat as an application error
      if (errorCode === 'auth/popup-closed-by-user' || errorCode === 'auth/cancelled-popup-request') {
        // User deliberately dismissed the login window
        return null;
      }

      if (errorCode === 'auth/popup-blocked') {
        alert('Trình duyệt đang chặn cửa sổ đăng nhập. Vui lòng cho phép bật popup trên trình duyệt của bạn.');
        return null;
      }

      console.warn('[AuthProvider] Đăng nhập Google không hoàn tất:', error?.message || error);
      alert('Đăng nhập không thành công: ' + (error?.message || 'Lỗi xác thực'));
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
