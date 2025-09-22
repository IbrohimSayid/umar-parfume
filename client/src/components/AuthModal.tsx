'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { toast } from 'react-toastify';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const AuthModal = ({ isOpen, onClose, onSuccess }: AuthModalProps) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [step, setStep] = useState(1);
  const [smsCode, setSmsCode] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoginMode, setIsLoginMode] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];
  
  const { sendVerificationCode, verifyCode, saveUserProfile, checkPhoneExists } = useAuth();
  const { t } = useLanguage();

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setFirstName('');
      setLastName('');
      setPhoneNumber('');
      setPassword('');
      setSmsCode(['', '', '', '', '', '']);
      setError('');
    }
  }, [isOpen]);

  const validateForm = () => {
    if (!isLoginMode) {
      if (!firstName.trim()) {
        setError('Ismingizni kiriting');
        return false;
      }
      if (!lastName.trim()) {
        setError('Familiyangizni kiriting');
        return false;
      }
    }
    
    if (!phoneNumber.trim() || phoneNumber.length !== 9) {
      setError('To\'g\'ri telefon raqam kiriting (9 raqam)');
      return false;
    }
    if (!password.trim() || password.length < 6) {
      setError('Parol kamida 6 ta belgidan iborat bo\'lishi kerak');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      const formattedPhone = `+998${phoneNumber}`;
      
      // Register rejimida telefon raqam mavjudligini tekshirish
      if (!isLoginMode) {
        const phoneExists = await checkPhoneExists(formattedPhone);
        if (phoneExists) {
          setError('Bu telefon raqam allaqachon ro yxatdan o tgan. Login qiling yoki boshqa raqam kiriting.');
          return;
        }
      }
      
      const result = await sendVerificationCode(formattedPhone);
      
      if (result.success) {
        setStep(2);
      } else {
        setError(result.error || 'SMS yuborishda xatolik yuz berdi');
      }
    } catch (error: any) {
      setError(error.message || 'Xatolik yuz berdi');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSmsInputChange = (index: number, value: string) => {
    if (value.length > 1) {
      // Agar foydalanuvchi butun kodni qo'ysa (paste qilsa)
      if (value.length === 6 && /^\d+$/.test(value)) {
        const newSmsCode = value.split('');
        setSmsCode(newSmsCode);
        // Oxirgi inputga fokus
        inputRefs[5].current?.focus();
      } else {
        // Faqat birinchi raqamni olamiz
        const newSmsCode = [...smsCode];
        newSmsCode[index] = value[0];
        setSmsCode(newSmsCode);
      }
    } else {
      // Normal holat - bir raqam kiritilgan
      const newSmsCode = [...smsCode];
      newSmsCode[index] = value;
      setSmsCode(newSmsCode);
      
      // Agar raqam kiritilgan bo'lsa, keyingi inputga o'tish
      if (value !== '' && index < 5) {
        inputRefs[index + 1].current?.focus();
      }
    }
  };

  const handleSmsKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    // Backspace bosilganda, oldingi inputga qaytish
    if (e.key === 'Backspace' && !smsCode[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  };

  const handleVerifyCode = async () => {
    const code = smsCode.join('');
    if (code.length !== 6) {
      setError('6 raqamli kodni to\'liq kiriting');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      const result = await verifyCode(code);
      
      if (result.success) {
        if (!isLoginMode) {
          // Ro'yxatdan o'tish rejimida foydalanuvchi ma'lumotlarini saqlash
          const profile = {
            uid: result.user.uid,
            phoneNumber: result.user.phoneNumber || `+998${phoneNumber}`,
            firstName,
            lastName,
            password
          };
          
          const saved = await saveUserProfile(profile);
          
          if (saved) {
            toast.success('Ro\'yxatdan o\'tish muvaffaqiyatli yakunlandi!');
            if (onSuccess) onSuccess();
            onClose();
          } else {
            setError('Profil saqlashda xatolik yuz berdi');
          }
        } else {
          // Kirish rejimida - faqat xabar ko'rsatish
          toast.success('Muvaffaqiyatli kirdingiz!');
          if (onSuccess) onSuccess();
          onClose();
        }
      } else {
        setError(result.error || 'Tasdiqlash kodini tekshirishda xatolik');
      }
    } catch (error: any) {
      setError(error.message || 'Xatolik yuz berdi');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Faqat raqamlarni qabul qilish
    const value = e.target.value.replace(/\D/g, '');
    // Maksimum 9 ta raqam
    if (value.length <= 9) {
      setPhoneNumber(value);
    }
  };

  const toggleMode = () => {
    setIsLoginMode(!isLoginMode);
    setError('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md transform transition-all duration-300 scale-100">
        {/* Header */}
        <div className="bg-gradient-to-r from-yellow-400 to-yellow-600 p-6 rounded-t-3xl">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">
                  {step === 1 ? (isLoginMode ? 'Kirish' : 'Ro\'yxatdan o\'tish') : 'Tasdiqlash'}
                </h2>
                <p className="text-white/80 text-sm">
                  {step === 1 ? 'Ma\'lumotlaringizni kiriting' : 'SMS kodini kiriting'}
                </p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="text-white/80 hover:text-white w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
        
        <div className="p-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          )}
          
          {step === 1 ? (
            <div className="space-y-5">
              {!isLoginMode && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 font-semibold mb-2">Ism *</label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full border-2 border-gray-200 rounded-xl p-3 focus:border-yellow-400 focus:ring-0 transition-all duration-200 text-gray-900"
                      placeholder="Ismingizni kiriting"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-gray-700 font-semibold mb-2">Familiya *</label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full border-2 border-gray-200 rounded-xl p-3 focus:border-yellow-400 focus:ring-0 transition-all duration-200 text-gray-900"
                      placeholder="Familiyangizni kiriting"
                    />
                  </div>
                </div>
              )}
              
              <div>
                <label className="block text-gray-700 font-semibold mb-2">Telefon raqam *</label>
                <div className="flex">
                  <span className="inline-flex items-center px-4 text-gray-700 bg-gray-100 border-2 border-r-0 border-gray-200 rounded-l-xl font-semibold">
                    +998
                  </span>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={handlePhoneNumberChange}
                    className="w-full border-2 border-gray-200 rounded-r-xl p-3 focus:border-yellow-400 focus:ring-0 transition-all duration-200 text-gray-900"
                    placeholder="901234567"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-gray-700 font-semibold mb-2">{t.password} *</label>
                <div className="relative">
                <input
                    type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                    className="w-full border-2 border-gray-200 rounded-xl p-3 focus:border-yellow-400 focus:ring-0 transition-all duration-200 text-gray-900 pr-10"
                    placeholder={t.password}
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
              
              <div className="flex flex-col space-y-3 pt-4">
                <button
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black font-bold py-3 px-4 rounded-xl transition-all duration-200 transform hover:scale-[1.02] shadow-lg disabled:opacity-50 disabled:transform-none"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin mr-2"></div>
                      SMS yuborilmoqda...
                    </div>
                  ) : (
                    isLoginMode ? 'Kirish' : 'Ro\'yxatdan o\'tish'
                  )}
                </button>
                
                <button
                  onClick={toggleMode}
                  className="w-full text-gray-600 hover:text-gray-800 py-2 font-medium transition-colors"
                >
                  {isLoginMode ? 'Hisobingiz yo\'qmi? Ro\'yxatdan o\'ting' : 'Hisobingiz bormi? Kirish'}
                </button>
              </div>
              
              <div id="recaptcha-container"></div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Tasdiqlash kodi</h3>
                <p className="text-gray-600">
                  <span className="font-semibold">+998{phoneNumber}</span> raqamiga yuborilgan 6 raqamli kodni kiriting
                </p>
              </div>
              
              <div className="flex justify-center space-x-3">
                {smsCode.map((digit, index) => (
                  <input
                    key={index}
                    ref={inputRefs[index]}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleSmsInputChange(index, e.target.value)}
                    onKeyDown={(e) => handleSmsKeyDown(index, e)}
                    className="w-12 h-14 text-center border-2 border-gray-200 rounded-xl text-gray-900 text-xl font-bold focus:border-yellow-400 focus:ring-0 transition-all duration-200"
                  />
                ))}
              </div>
              
              <button
                onClick={handleVerifyCode}
                disabled={isLoading || smsCode.join('').length !== 6}
                className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black font-bold py-3 px-4 rounded-xl transition-all duration-200 transform hover:scale-[1.02] shadow-lg disabled:opacity-50 disabled:transform-none"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin mr-2"></div>
                    Tekshirilmoqda...
                  </div>
                ) : (
                  'Tasdiqlash'
                )}
              </button>
              
              <button
                onClick={() => setStep(1)}
                className="w-full text-gray-600 hover:text-gray-800 py-2 font-medium transition-colors"
              >
                ← Orqaga qaytish
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthModal; 