'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { toast } from 'react-toastify';

export default function ProfilePage() {
  const router = useRouter();
  const { user, userProfile, saveUserProfile, logout } = useAuth();
  const { t } = useLanguage();
  
  const [isEditing, setIsEditing] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push('/');
      return;
    }
    
    if (userProfile) {
      setFirstName(userProfile.firstName || '');
      setLastName(userProfile.lastName || '');
      setPhoneNumber(userProfile.phoneNumber?.replace('+998', '') || '');
    }
  }, [user, userProfile, router]);

  const handleSaveProfile = async () => {
    if (!user || !userProfile) return;
    
    setIsLoading(true);
    
    if (newPassword && newPassword !== confirmPassword) {
      toast.error(t.passwordMismatch);
      setIsLoading(false);
      return;
    }
    
    try {
      const updatedProfile = {
        ...userProfile,
        firstName,
        lastName,
        phoneNumber: `+998${phoneNumber}`,
      };
      
      // Firebase Authentikatsiyada parol yangilash (agar yangi parol berilgan bo'lsa)
      // Eslatma: Firebase Auth da parol yangilash uchun avval foydalanuvchini qayta autentifikatsiya qilish kerak.
      // Bu yerda soddalashtirilgan versiyasi. Haqiqiy loyihada ko'proq xavfsizlik logikasi bo'lishi kerak.
      if (newPassword) {
        // Bu yerda Firebase Auth da parol yangilash logikasi bo'lishi kerak
        // masalan: await updatePassword(user, newPassword);
        // Hozircha faqat local state da saqlaymiz
        updatedProfile.password = newPassword;
      }
      
      const success = await saveUserProfile(updatedProfile);
      
      if (success) {
        toast.success(t.profileUpdateSuccess);
        setIsEditing(false);
        setNewPassword('');
        setConfirmPassword('');
      } else {
        toast.error(t.profileUpdateError);
      }
    } catch (error) {
      console.error('Profil yangilashda xatolik:', error);
      toast.error(t.error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    // Haqiqiy loyihada, bu yerda foydalanuvchi hisobini o'chirish logikasi bo'lishi kerak
    toast.info('Hisobni o\'chirish funksiyasi hozircha ishlamaydi');
    setShowDeleteConfirm(false);
    // logout();
    // router.push('/');
  };

  if (!user || !userProfile) {
    return (
      <div className="min-h-screen bg-gray-50 py-10">
        <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow">
          <p className="text-center text-gray-600">Yuklanyapti...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow">
        <h1 className="text-2xl font-bold mb-6 text-center text-gray-900">{t.myProfile}</h1>
        
        {/* Profile info */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-20 h-20 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center text-black font-bold text-xl mb-4">
            {userProfile?.firstName?.charAt(0) || user?.phoneNumber?.charAt(4) || 'U'}
          </div>
          
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900">{userProfile.firstName} {userProfile.lastName}</h2>
            <p className="text-gray-600">{userProfile.phoneNumber}</p>
          </div>
        </div>
        
        {/* Edit Form */}
        {isEditing ? (
          <div className="space-y-4">
            <div>
              <label className="block text-gray-700 mb-1">{t.firstName}</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full border border-gray-300 rounded p-2 text-gray-900"
              />
            </div>
            
            <div>
              <label className="block text-gray-700 mb-1">{t.lastName}</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full border border-gray-300 rounded p-2 text-gray-900"
              />
            </div>
            
            <div>
              <label className="block text-gray-700 mb-1">{t.phoneNumber}</label>
              <div className="flex">
                <span className="inline-flex items-center px-3 text-sm text-gray-900 bg-gray-200 border border-r-0 border-gray-300 rounded-l-md">
                  +998
                </span>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 9))}
                  maxLength={9}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-r-md text-gray-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-700 mb-1">{t.newPassword}</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full border border-gray-300 rounded p-2 text-gray-900 pr-10"
                  placeholder={t.newPassword}
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.875m-1.563 3.875L.05 12C1.325 5.923 7.114 2 12 2c1.789 0 3.528.58 5.064 1.574M18 10v4M3 21h18" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 5.923 7.523 2 12 2c4.478 0 8.268 2.943 9.542 7 .296 1.157.296 2.478 0 3.638C20.268 18.077 16.477 22 12 22c-4.478 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-gray-700 mb-1">{t.confirmNewPassword}</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full border border-gray-300 rounded p-2 text-gray-900 pr-10"
                  placeholder={t.confirmNewPassword}
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.875m-1.563 3.875L.05 12C1.325 5.923 7.114 2 12 2c1.789 0 3.528.58 5.064 1.574M18 10v4M3 21h18" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 5.923 7.523 2 12 2c4.478 0 8.268 2.943 9.542 7 .296 1.157.296 2.478 0 3.638C20.268 18.077 16.477 22 12 22c-4.478 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
            
            <div className="flex justify-between mt-6">
              <button
                onClick={handleSaveProfile}
                disabled={isLoading}
                className="bg-yellow-400 text-black px-4 py-2 rounded hover:bg-yellow-500 transition-colors cursor-pointer font-semibold"
              >
                {isLoading ? t.loading : t.saveChanges}
              </button>
              
              <button
                onClick={() => setIsEditing(false)}
                className="text-gray-700 border border-gray-300 px-4 py-2 rounded hover:bg-gray-100 cursor-pointer font-semibold"
              >
                {t.cancelEdit}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Profile details */}
            <div className="border-t border-b py-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">{t.firstName}:</span>
                <span className="text-gray-900">{userProfile.firstName}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">{t.lastName}:</span>
                <span className="text-gray-900">{userProfile.lastName}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">{t.phoneNumber}:</span>
                <span className="text-gray-900">{userProfile.phoneNumber}</span>
              </div>
            </div>
            
            <div className="flex flex-col space-y-3 mt-6">
              <button
                onClick={() => setIsEditing(true)}
                className="w-full bg-black text-white px-4 py-3 rounded-xl font-semibold hover:bg-gray-800 transition-colors"
              >
                {t.editProfile}
              </button>
              
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full border border-red-500 text-red-500 px-4 py-3 rounded-xl font-semibold hover:bg-red-50 transition-colors"
              >
                {t.deleteAccount}
              </button>
            
            <button
              onClick={logout}
                className="w-full border border-gray-300 text-gray-700 px-4 py-3 rounded-xl font-semibold hover:bg-gray-100 transition-colors"
            >
                {t.logout}
            </button>
            </div>
          </div>
        )}
        
        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all duration-300 scale-100">
              <div className="bg-red-50 border-2 border-red-200 p-6 rounded-t-2xl">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">{t.deleteAccount}</h3>
                </div>
              </div>
              
              <div className="p-6">
                <p className="text-gray-600 mb-6 leading-relaxed">{t.deleteAccountInfo}</p>
                <div className="flex space-x-3">
                <button
                    onClick={handleDeleteAccount}
                    className="flex-1 bg-red-500 hover:bg-red-600 text-white px-4 py-3 rounded-xl font-semibold transition-colors"
                >
                    {t.deleteAccountConfirm}
                </button>
                <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 border border-gray-300 text-gray-700 px-4 py-3 rounded-xl font-semibold hover:bg-gray-100 transition-colors"
                >
                    {t.cancel}
                </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 