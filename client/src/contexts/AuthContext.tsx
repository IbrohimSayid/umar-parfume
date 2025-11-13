'use client';

import React, { createContext, useState, useContext, useEffect } from 'react';
import { auth, db } from '../lib/firebase';
import {
  // RecaptchaVerifier,
  // signInWithPhoneNumber,
  // PhoneAuthProvider,
  User,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, setDoc, getDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { toast } from 'react-toastify';

// User profile interface
interface UserProfile {
  uid: string;
  phoneNumber: string;
  firstName?: string;
  lastName?: string;
  password?: string;
  createdAt?: string;
}

// Auth context interface
interface MockUser {
  uid: string;
  phoneNumber: string;
  isAnonymous: boolean;
  providerData: unknown[];
  metadata: { creationTime: string; lastSignInTime: string };
  delete: () => Promise<void>;
  getIdToken: () => Promise<string>;
  getIdTokenResult: () => Promise<unknown>;
  reload: () => Promise<void>;
  tenantId: string | null;
  toJSON: () => Record<string, unknown>;
}

interface MockConfirmationResult {
  verificationId: string;
  confirm: (code: string) => Promise<{ user: MockUser }>;
}

type AuthenticatedUser = User | MockUser;

interface VerificationResponse {
  success: boolean;
  confirmationResult?: MockConfirmationResult;
  error?: string;
}

interface VerifyCodeResponse {
  success: boolean;
  user?: AuthenticatedUser;
  error?: string;
}

interface LoginResponse {
  success: boolean;
  user?: AuthenticatedUser;
  error?: string;
}

interface AuthContextType {
  user: AuthenticatedUser | null;
  userProfile: UserProfile | null;
  sendVerificationCode: (phoneNumber: string) => Promise<VerificationResponse>;
  loginWithCredentials: (phoneNumber: string, password: string) => Promise<LoginResponse>;
  verifyCode: (code: string) => Promise<VerifyCodeResponse>;
  saveUserProfile: (profile: UserProfile) => Promise<boolean>;
  checkPhoneExists: (phoneNumber: string) => Promise<boolean>;
  isAuthenticated: () => boolean;
  logout: () => void;
}

type WindowWithAuth = Window & {
  confirmationResult?: MockConfirmationResult;
  pendingMockUser?: MockUser;
};

const createMockUser = (phoneNumber: string, uid?: string): MockUser => ({
  uid: uid ?? `user_${Date.now()}`,
  phoneNumber,
  isAnonymous: false,
  providerData: [],
  metadata: { creationTime: '', lastSignInTime: '' },
  delete: async () => {},
  getIdToken: async () => '',
  getIdTokenResult: async () => ({}),
  reload: async () => {},
  tenantId: null,
  toJSON: () => ({}),
});

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider component
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  // Check if user is authenticated on load
  useEffect(() => {
    // Avval localStorage'dan token tekshirish
    const checkStoredAuth = () => {
      const storedToken = localStorage.getItem('userAuthToken');
      const tokenExpiry = localStorage.getItem('userTokenExpiry');
      
      if (storedToken && tokenExpiry) {
        const expiryDate = new Date(tokenExpiry);
        const now = new Date();
        
        if (now < expiryDate) {
          // Token hali amal qiladi
          const storedUser = localStorage.getItem('userData');
          const storedProfile = localStorage.getItem('userProfile');
          
          if (storedUser && storedProfile) {
            setUser(JSON.parse(storedUser) as AuthenticatedUser);
            setUserProfile(JSON.parse(storedProfile));
            return true;
          }
        } else {
          // Token muddati tugagan
          localStorage.removeItem('userAuthToken');
          localStorage.removeItem('userTokenExpiry');
          localStorage.removeItem('userData');
          localStorage.removeItem('userProfile');
        }
      }
      return false;
    };

    // Avval stored token ni tekshirish
    const hasValidToken = checkStoredAuth();
    
    if (!hasValidToken) {
      const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
        if (currentUser) {
          setUser(currentUser);
          
          // Try to load user profile from Firestore
          try {
            const userDocRef = doc(db, "users", currentUser.uid);
            const userDoc = await getDoc(userDocRef);
            
            if (userDoc.exists()) {
              setUserProfile(userDoc.data() as UserProfile);
            } else {
              // Try to load from localStorage as fallback
              const storedProfile = localStorage.getItem(`userProfile_${currentUser.uid}`);
              if (storedProfile) {
                const parsedProfile = JSON.parse(storedProfile);
                setUserProfile(parsedProfile);
                
                // Foydalanuvchi ma'lumotlarini localStorage dan Firestore ga ko'chirish
                try {
                  await setDoc(userDocRef, parsedProfile, { merge: true });
                  console.log('✅ Profil localStorage dan Firestore ga ko\'chirildi');
                } catch (err) {
                  console.error('Profilni Firestore ga ko\'chirishda xatolik:', err);
                }
              }
            }
          } catch (error) {
            console.error('Error loading user profile:', error);
          }
        } else {
          setUser(null);
          setUserProfile(null);
        }
      });

      return () => unsubscribe();
    }
  }, []);

  // Send SMS verification code
  const sendVerificationCode = async (phoneNumber: string): Promise<VerificationResponse> => {
    try {
      // Test rejimda ishlash (haqiqiy SMS yubormasdan)
      console.log('📱 TEST REJIMI: SMS kod yuborildi:', phoneNumber);
      
      // Test SMS kodi
      const testSmsCode = '123456';
      
      // Foydalanuvchiga ko'rsatish
      toast.info(`📱 TEST REJIMI: SMS kod - ${testSmsCode}`, {
        autoClose: 15000, // 15 sekund ko'rsatiladi
        position: "top-center"
      });
      
      const mockUser = createMockUser(phoneNumber);
      
      // Mock confirmation result
      const mockConfirmationResult: MockConfirmationResult = {
        verificationId: '',
        confirm: async (code: string) => {
          if (code === testSmsCode) {
            return { user: mockUser };
          } else {
            throw new Error('Noto\'g\'ri tasdiqlash kodi. Test kodi: ' + testSmsCode);
          }
        }
      };

      if (typeof window !== 'undefined') {
        const win = window as WindowWithAuth;
        win.confirmationResult = mockConfirmationResult;
        win.pendingMockUser = mockUser;
      }
      
      return { success: true, confirmationResult: mockConfirmationResult };
    } catch (error) {
      console.error('SMS sending error:', error);
      
      let errorMessage = 'SMS yuborishda xatolik yuz berdi';
      if (error && typeof error === 'object' && 'code' in error) {
        if (error.code === 'auth/invalid-phone-number') {
          errorMessage = 'Telefon raqam noto\'g\'ri formatda. Masalan: +998901234567';
        } else if (error.code === 'auth/quota-exceeded') {
          errorMessage = 'SMS limitiga yetdingiz. Keyinroq urinib ko\'ring.';
        } else if (error.code === 'auth/operation-not-allowed') {
          errorMessage = 'SMS xizmati hali yoqilmagan. Firebase Console da yoqing.';
        } else if (error.code === 'auth/missing-verification-id') {
          errorMessage = 'Tasdiqlash ID topilmadi. Qayta urinib ko\'ring.';
        }
      }
      
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Verify SMS code
  const verifyCode = async (code: string): Promise<VerifyCodeResponse> => {
    try {
      if (typeof window !== 'undefined') {
        const win = window as WindowWithAuth;
        if (!win.confirmationResult) {
          toast.error('Avval telefon raqamni kiriting');
          return { success: false, error: 'Avval telefon raqamni kiriting' };
        }
        const result = await win.confirmationResult.confirm(code);
        const confirmedUser: AuthenticatedUser | null =
          result.user || win.pendingMockUser || null;
        if (!confirmedUser) {
          toast.error('Foydalanuvchi maʼlumotlari topilmadi');
          return { success: false, error: 'Foydalanuvchi topilmadi' };
        }

        setUser(confirmedUser);
        delete win.pendingMockUser;
        delete win.confirmationResult;

        const token = `umar_parfume_${Date.now()}_${confirmedUser.uid}`;
        const expiryDate = new Date();
        expiryDate.setMonth(expiryDate.getMonth() + 1);

        localStorage.setItem('userAuthToken', token);
        localStorage.setItem('userTokenExpiry', expiryDate.toISOString());
        localStorage.setItem('userData', JSON.stringify(confirmedUser));

        return { success: true, user: confirmedUser };
      }
      toast.error('Avval telefon raqamni kiriting');
      return { success: false, error: 'Avval telefon raqamni kiriting' };
    } catch (error) {
      console.error('Verification error:', error);
      
      let errorMessage = 'Tasdiqlash kodini tekshirishda xatolik yuz berdi';
      if (error && typeof error === 'object' && 'code' in error) {
        if (error.code === 'auth/invalid-verification-code') {
          errorMessage = 'Noto\'g\'ri tasdiqlash kodi';
        } else if (error.code === 'auth/code-expired') {
          errorMessage = 'Tasdiqlash kodi muddati tugadi';
        }
      }
      
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Save user profile
  const normalizePhoneNumber = (value?: string) => {
    if (!value) return '';
    return value.startsWith('+') ? value : `+${value.replace(/\D/g, '')}`;
  };

  const saveUserProfile = async (profile: UserProfile) => {
    try {
      const fallbackUser =
        profile.phoneNumber
          ? createMockUser(
              normalizePhoneNumber(profile.phoneNumber),
              profile.uid
            )
          : null;

      const activeUser = user ?? fallbackUser;

      if (!activeUser) {
        toast.error('Foydalanuvchi tizimga kirmagan');
        console.error('User mavjud emas, profil saqlanmadi');
        return false;
      }

      if (!user) {
        setUser(activeUser);
      }

      // To'liq profil ma'lumotlarini tayyorlash
      const normalizedPhone = normalizePhoneNumber(
        activeUser.phoneNumber || profile.phoneNumber
      );

      const fullProfile: UserProfile = {
        ...profile,
        uid: profile.uid || activeUser.uid,
        phoneNumber: normalizedPhone,
        createdAt: profile.createdAt || new Date().toISOString()
      };

      // Set the profile in state
      setUserProfile(fullProfile);
      
      // Ma'lumotlarni Firestore'ga saqlash
      try {
        // Ma'lumotlarni Firestore'ga saqlash
        const usersCollection = collection(db, "users");
        const userDocRef = doc(usersCollection, fullProfile.uid);
        
        await setDoc(userDocRef, fullProfile, { merge: true });
        
        console.log('✅ Profil Firestore ga saqlandi:', fullProfile);
        toast.success('Profil saqlandi');
        
        // Vaqtinchalik localStorage ga ham saqlash
        localStorage.setItem(`userProfile_${fullProfile.uid}`, JSON.stringify(fullProfile));
        localStorage.setItem('userProfile', JSON.stringify(fullProfile));
        
        return true;
      } catch (firestoreError) {
        console.error('Firestore saqlashda xatolik:', firestoreError);
        
        // Xatolik haqida ma'lumot
        toast.error('Ma\'lumotlar bazasiga saqlashda xatolik yuz berdi');
        
        // Vaqtinchalik localStorage ga saqlash
        localStorage.setItem(`userProfile_${fullProfile.uid}`, JSON.stringify(fullProfile));
        console.log('⚠️ Profil faqat localStorage ga saqlandi:', fullProfile);
        toast.warning('Ma\'lumotlar vaqtinchalik saqlandi');
        
        return false;
      }
    } catch (error) {
      console.error('Profil saqlashda xatolik:', error);
      toast.error('Profil saqlashda xatolik yuz berdi');
      return false;
    }
  };

  // Check if user is authenticated
  const isAuthenticated = () => {
    return user !== null;
  };

  // Logout
  const logout = () => {
    auth.signOut().then(() => {
      setUser(null);
      setUserProfile(null);
      
      // Barcha localStorage ma'lumotlarini tozalash
      localStorage.removeItem('userAuthToken');
      localStorage.removeItem('userTokenExpiry');
      localStorage.removeItem('userData');
      localStorage.removeItem('userProfile');
      
      toast.info('Tizimdan chiqildi');
    }).catch((error) => {
      console.error('Logout error:', error);
      toast.error('Tizimdan chiqishda xatolik yuz berdi');
    });
  };

  // Check if phone number already exists
  const checkPhoneExists = async (phoneNumber: string): Promise<boolean> => {
    try {
      const usersCollection = collection(db, "users");
      const phoneQuery = query(usersCollection, where("phoneNumber", "==", phoneNumber));
      const querySnapshot = await getDocs(phoneQuery);
      const exists = !querySnapshot.empty;
      if (exists) {
        console.log('📱 Telefon raqam Firestore da mavjud:', phoneNumber);
      } else {
        console.log('✅ Telefon raqam mavjud emas:', phoneNumber);
      }
      return exists;
    } catch (error) {
      console.error('Telefon raqam tekshirishda xatolik:', error);
      // Xatolik bo'lsa, ehtiyot chorasi sifatida false qaytarish
      return false;
    }
  };

  const loginWithCredentials = async (phoneNumber: string, password: string): Promise<LoginResponse> => {
    try {
      const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;
      const usersCollection = collection(db, "users");
      const phoneQuery = query(usersCollection, where("phoneNumber", "==", formattedPhone));
      const querySnapshot = await getDocs(phoneQuery);
      
      if (querySnapshot.empty) {
        toast.error('Bu telefon raqami bilan foydalanuvchi topilmadi');
        return { success: false, error: 'Telefon raqami topilmadi' };
      }

      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data() as UserProfile;

      if (!userData.password || userData.password !== password) {
        toast.error('Parol noto‘g‘ri');
        return { success: false, error: 'Parol noto\'g\'ri' };
      }

      const authUser = createMockUser(
        userData.phoneNumber,
        (userData.uid || userDoc.id) as string
      );

      setUser(authUser);
      setUserProfile(userData);

      const token = `umar_parfume_${Date.now()}_${authUser.uid}`;
      const expiryDate = new Date();
      expiryDate.setMonth(expiryDate.getMonth() + 1);

      localStorage.setItem('userAuthToken', token);
      localStorage.setItem('userTokenExpiry', expiryDate.toISOString());
      localStorage.setItem('userData', JSON.stringify(authUser));
      localStorage.setItem('userProfile', JSON.stringify(userData));
      localStorage.setItem(`userProfile_${authUser.uid}`, JSON.stringify(userData));

      toast.success('Muvaffaqiyatli kirdingiz!');
      return { success: true, user: authUser };
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Kirishda xatolik yuz berdi');
      return { success: false, error: 'Login error' };
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      userProfile,
      sendVerificationCode,
      loginWithCredentials,
      verifyCode,
      saveUserProfile,
      checkPhoneExists,
      isAuthenticated,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext; 