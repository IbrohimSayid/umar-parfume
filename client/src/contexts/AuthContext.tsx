'use client';

import React, { createContext, useState, useContext, useEffect } from 'react';
import { auth, db } from '../lib/firebase';
import { 
  RecaptchaVerifier, 
  signInWithPhoneNumber, 
  PhoneAuthProvider, 
  User, 
  onAuthStateChanged 
} from 'firebase/auth';
import { doc, setDoc, getDoc, collection, getDocs } from 'firebase/firestore';
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
interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  sendVerificationCode: (phoneNumber: string) => Promise<any>;
  verifyCode: (code: string) => Promise<any>;
  saveUserProfile: (profile: UserProfile) => Promise<boolean>;
  checkPhoneExists: (phoneNumber: string) => Promise<boolean>;
  isAuthenticated: () => boolean;
  logout: () => void;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider component
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
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
            setUser(JSON.parse(storedUser));
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

  // Setup reCAPTCHA
  const setupRecaptcha = () => {
    if (!(window as any).recaptchaVerifier) {
      (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        'size': 'invisible',
        'callback': (response: any) => {
          console.log('reCAPTCHA solved');
        },
        'expired-callback': () => {
          console.log('reCAPTCHA expired');
        }
      });
    }
  };

  // Send SMS verification code
  const sendVerificationCode = async (phoneNumber: string) => {
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
      
      // Mock user yaratish (lekin Firebase ID bilan)
      const mockUser = {
        uid: `user_${Date.now()}`,
        phoneNumber: phoneNumber,
        isAnonymous: false
      };
      
      // Foydalanuvchini darhol o'rnatish
      setUser(mockUser as any);
      
      // Mock confirmation result
      (window as any).confirmationResult = {
        confirm: async (code: string) => {
          if (code === testSmsCode) {
            return { user: mockUser };
          } else {
            throw new Error('Noto\'g\'ri tasdiqlash kodi. Test kodi: ' + testSmsCode);
          }
        }
      };
      
      return { success: true, confirmationResult: (window as any).confirmationResult };
      
      /* HAQIQIY SMS YUBORISH - KEYINROQ YOQISH UCHUN
      setupRecaptcha();
      const appVerifier = (window as any).recaptchaVerifier;
      const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
      (window as any).confirmationResult = confirmationResult;
      
      toast.success('Tasdiqlash kodi yuborildi');
      console.log('✅ SMS yuborildi:', phoneNumber);
      
      return { success: true, confirmationResult };
      */
    } catch (error: any) {
      console.error('SMS sending error:', error);
      
      let errorMessage = 'SMS yuborishda xatolik yuz berdi';
      if (error.code === 'auth/invalid-phone-number') {
        errorMessage = 'Telefon raqam noto\'g\'ri formatda. Masalan: +998901234567';
      } else if (error.code === 'auth/quota-exceeded') {
        errorMessage = 'SMS limitiga yetdingiz. Keyinroq urinib ko\'ring.';
      } else if (error.code === 'auth/operation-not-allowed') {
        errorMessage = 'SMS xizmati hali yoqilmagan. Firebase Console da yoqing.';
      } else if (error.code === 'auth/missing-verification-id') {
        errorMessage = 'Tasdiqlash ID topilmadi. Qayta urinib ko\'ring.';
      }
      
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Verify SMS code
  const verifyCode = async (code: string) => {
    try {
      if (!(window as any).confirmationResult) {
        toast.error('Avval telefon raqamni kiriting');
        return { success: false, error: 'Avval telefon raqamni kiriting' };
      }

      const result = await (window as any).confirmationResult.confirm(code);
      setUser(result.user);
      
      // 1 oylik token yaratish
      const token = `umar_parfume_${Date.now()}_${result.user.uid}`;
      const expiryDate = new Date();
      expiryDate.setMonth(expiryDate.getMonth() + 1); // 1 oy qo'shish
      
      // Token va ma'lumotlarni saqlash
      localStorage.setItem('userAuthToken', token);
      localStorage.setItem('userTokenExpiry', expiryDate.toISOString());
      localStorage.setItem('userData', JSON.stringify(result.user));
      
      return { success: true, user: result.user };
    } catch (error: any) {
      console.error('Verification error:', error);
      
      let errorMessage = 'Tasdiqlash kodini tekshirishda xatolik yuz berdi';
      if (error.code === 'auth/invalid-verification-code') {
        errorMessage = 'Noto\'g\'ri tasdiqlash kodi';
      } else if (error.code === 'auth/code-expired') {
        errorMessage = 'Tasdiqlash kodi muddati tugadi';
      }
      
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Save user profile
  const saveUserProfile = async (profile: UserProfile) => {
    try {
      if (!user) {
        toast.error('Foydalanuvchi tizimga kirmagan');
        console.error('User mavjud emas, profil saqlanmadi');
        return false;
      }

      // To'liq profil ma'lumotlarini tayyorlash
      const fullProfile: UserProfile = {
        ...profile,
        uid: user.uid,
        phoneNumber: user.phoneNumber || profile.phoneNumber,
        createdAt: profile.createdAt || new Date().toISOString()
      };

      // Set the profile in state
      setUserProfile(fullProfile);
      
      // Ma'lumotlarni Firestore'ga saqlash
      try {
        // Ma'lumotlarni Firestore'ga saqlash
        const usersCollection = collection(db, "users");
        const userDocRef = doc(usersCollection, user.uid);
        
        await setDoc(userDocRef, fullProfile, { merge: true });
        
        console.log('✅ Profil Firestore ga saqlandi:', fullProfile);
        toast.success('Profil saqlandi');
        
        // Vaqtinchalik localStorage ga ham saqlash
        localStorage.setItem(`userProfile_${user.uid}`, JSON.stringify(fullProfile));
        localStorage.setItem('userProfile', JSON.stringify(fullProfile));
        
        return true;
      } catch (firestoreError) {
        console.error('Firestore saqlashda xatolik:', firestoreError);
        
        // Xatolik haqida ma'lumot
        toast.error('Ma\'lumotlar bazasiga saqlashda xatolik yuz berdi');
        
        // Vaqtinchalik localStorage ga saqlash
        localStorage.setItem(`userProfile_${user.uid}`, JSON.stringify(fullProfile));
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
      // Firestore'dan tekshirish
      const usersCollection = collection(db, "users");
      const querySnapshot = await getDocs(usersCollection);
      
      let phoneExists = false;
      querySnapshot.forEach((doc) => {
        const userData = doc.data();
        if (userData.phoneNumber === phoneNumber) {
          phoneExists = true;
        }
      });
      
      if (phoneExists) {
        console.log('📱 Telefon raqam Firestore da mavjud:', phoneNumber);
        return true;
      }
      
      // localStorage dan ham tekshirish (fallback)
      const allKeys = Object.keys(localStorage);
      const userKeys = allKeys.filter(key => key.startsWith('userProfile_'));
      
      for (const key of userKeys) {
        try {
          const userData = JSON.parse(localStorage.getItem(key) || '{}');
          if (userData.phoneNumber === phoneNumber) {
            console.log('📱 Telefon raqam localStorage da mavjud:', phoneNumber);
            return true;
          }
        } catch (error) {
          console.error('localStorage ma lumotini o qishda xatolik:', error);
        }
      }
      
      console.log('✅ Telefon raqam mavjud emas:', phoneNumber);
      return false;
    } catch (error) {
      console.error('Telefon raqam tekshirishda xatolik:', error);
      // Xatolik bo'lsa, ehtiyot chorasi sifatida false qaytarish
      return false;
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      userProfile,
      sendVerificationCode,
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