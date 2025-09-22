'use client';

import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onSwitchToRegister: () => void;
  onForgotPassword: () => void;
}

export default function LoginModal({ isOpen, onClose, onSuccess, onSwitchToRegister, onForgotPassword }: LoginModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Form data
  const [formData, setFormData] = useState({
    phoneNumber: '',
    password: ''
  });

  const { userProfile, checkPhoneExists } = useAuth();
  const { t } = useLanguage();

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Special handling for phone number
    if (name === 'phoneNumber') {
      // Remove all non-digits
      const digits = value.replace(/\D/g, '');
      
      // Limit to 9 digits after +998
      if (digits.length <= 9) {
        setFormData(prev => ({
          ...prev,
          [name]: digits
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Format phone number to international format
  const formatPhoneNumber = (phoneNumber: string) => {
    return `+998${phoneNumber}`;
  };

  // Handle login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validate form
      if (!formData.phoneNumber.trim() || !formData.password.trim()) {
        throw new Error('Barcha maydonlarni to\'ldiring');
      }

      if (formData.phoneNumber.length !== 9) {
        throw new Error('Telefon raqam 9 ta raqamdan iborat bo\'lishi kerak');
      }

      const formattedPhone = formatPhoneNumber(formData.phoneNumber);
      
      // Avval telefon raqam mavjudligini tekshirish
      const phoneExists = await checkPhoneExists(formattedPhone);
      if (!phoneExists) {
        throw new Error('Bu telefon raqam ro yxatdan o tmagan. Avval ro yxatdan o ting.');
      }
      
      // Check localStorage for user with this phone number
      const allKeys = Object.keys(localStorage);
      const userKeys = allKeys.filter(key => key.startsWith('userProfile_'));
      
      let foundUser = null;
      for (const key of userKeys) {
        const userData = JSON.parse(localStorage.getItem(key) || '{}');
        if (userData.phoneNumber === formattedPhone && userData.password === formData.password) {
          foundUser = userData;
          break;
        }
      }

      if (foundUser) {
        // 1 oylik token yaratish
        const token = `umar_parfume_${Date.now()}_${foundUser.uid}`;
        const expiryDate = new Date();
        expiryDate.setMonth(expiryDate.getMonth() + 1); // 1 oy qo'shish
        
        // Token va ma'lumotlarni saqlash
        localStorage.setItem('userAuthToken', token);
        localStorage.setItem('userTokenExpiry', expiryDate.toISOString());
        localStorage.setItem('userData', JSON.stringify({
          uid: foundUser.uid,
          phoneNumber: foundUser.phoneNumber,
          isAnonymous: false
        }));
        localStorage.setItem('userProfile', JSON.stringify(foundUser));
        
        // Success message
        alert(`✅ KIRISH MUVAFFAQIYATLI!\n\nXush kelibsiz, ${foundUser.firstName} ${foundUser.lastName}!`);
        
        onSuccess();
        onClose();
        resetForm();
      } else {
        throw new Error('Telefon raqam yoki parol noto\'g\'ri');
      }
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      phoneNumber: '',
      password: ''
    });
    setError('');
  };

  // Handle modal close
  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-black">
              Kirish
            </h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
              disabled={loading}
            >
              ×
            </button>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-md">
              {error}
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-black mb-1">
                Telefon raqam *
              </label>
              <div className="flex">
                <span className="inline-flex items-center px-3 text-sm text-black bg-gray-50 border border-r-0 border-gray-300 rounded-l-md">
                  +998
                </span>
                <input
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  required
                  maxLength={9}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-r-md focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent text-black"
                  placeholder="90 123 45 67"
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-black mb-1">
                {t.password} *
              </label>
              <div className="relative">
              <input
                  type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent text-black pr-10"
                  placeholder={t.password}
                disabled={loading}
              />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
                  disabled={loading}
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

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-yellow-400 text-black py-3 rounded-md font-semibold hover:bg-yellow-500 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Kirilmoqda...' : 'Kirish'}
            </button>

            {/* Forgot Password */}
            <div className="text-center">
              <button 
                type="button"
                onClick={onForgotPassword}
                className="text-yellow-600 hover:text-yellow-700 text-sm font-medium"
                disabled={loading}
              >
                Parolni unutdingizmi?
              </button>
            </div>

            {/* Switch to Register */}
            <div className="text-center mt-4">
              <p className="text-sm text-black">
                Akkauntingiz yo'qmi?{' '}
                <button 
                  type="button"
                  className="text-yellow-600 hover:text-yellow-700 font-medium"
                  onClick={onSwitchToRegister}
                  disabled={loading}
                >
                  Ro'yxatdan o'tish
                </button>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 