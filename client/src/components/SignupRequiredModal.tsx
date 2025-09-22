'use client';

// import { useState } from 'react'; // Ishlatilmagan

interface SignupRequiredModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSignup: () => void;
}

const SignupRequiredModal = ({ isOpen, onClose, onSignup }: SignupRequiredModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md transform transition-all duration-300 scale-100">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-t-3xl">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">
                  Ro&apos;yxatdan o&apos;tish
                </h2>
                <p className="text-white/80 text-sm">
                  Buyurtma berish uchun
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
          {/* Content */}
          <div className="text-center mb-6">
            <div className="w-20 h-20 bg-gradient-to-r from-blue-100 to-blue-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Buyurtma berish uchun ro&apos;yxatdan o&apos;ting</h3>
            <p className="text-gray-600 leading-relaxed">
              Mahsulotlarni buyurtma berish va buyurtmalaringizni kuzatish uchun avval tizimda ro&apos;yxatdan o&apos;tishingiz kerak.
            </p>
          </div>
          
          {/* Benefits */}
          <div className="space-y-3 mb-6">
            <div className="flex items-center space-x-3 text-gray-700">
              <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-sm">Tez va oson buyurtma berish</span>
            </div>
            <div className="flex items-center space-x-3 text-gray-700">
              <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-sm">Buyurtmalar tarixini ko&apos;rish</span>
            </div>
            <div className="flex items-center space-x-3 text-gray-700">
              <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-green-600 rounded-full"></div>
              </div>
              <span className="text-sm">1 oy davomida tizimda qolish</span>
            </div>
          </div>
          
          {/* Buttons */}
          <div className="flex flex-col space-y-3">
            <button
              onClick={onSignup}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-3 px-4 rounded-xl transition-all duration-200 transform hover:scale-[1.02] shadow-lg"
            >
              Ro&apos;yxatdan o&apos;tish
            </button>
            
            <button
              onClick={onClose}
              className="w-full text-gray-600 hover:text-gray-800 py-2 font-medium transition-colors border-2 border-gray-200 hover:border-gray-300 rounded-xl"
            >
              Orqaga
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupRequiredModal; 