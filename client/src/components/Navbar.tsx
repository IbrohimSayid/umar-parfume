'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from "next/image"; 
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import AuthModal from './AuthModal';

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isLanguageMenuOpen, setIsLanguageMenuOpen] = useState(false);
  const { user, userProfile, isAuthenticated, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();

  const menuItems = [
    { name: t.home, href: '/' },
    { name: t.products, href: '/mahsulotlar' },
    // { name: t.about, href: '/biz-haqimizda' },
  ];

  const authenticatedMenuItems = [
    { name: t.home, href: '/' },
    { name: t.products, href: '/mahsulotlar' },
    { name: t.orders, href: '/buyurtmalarim' },
    // { name: t.about, href: '/biz-haqimizda' },
  ];

  return (
    <nav className="bg-black text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center space-x-3 group cursor-pointer">
              {/* Yangi Logo */}
              <div className="relative">
                <Image
                  src="/logo.png" // Rasmingizning yo'li
                  alt="Umar Perfume Logo" // Rasm uchun tavsif
                  width={40} // Rasmingizning kengligi (pikselda)
                  height={40} // Rasmingizning balandligi (pikselda)
                  className="rounded-lg shadow-lg group-hover:shadow-yellow-400/30 transition-all duration-300"
                />
              </div>
              
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold bg-gradient-to-r from-white to-yellow-400 bg-clip-text text-transparent">
                  Umar Perfume
                </h1>
                <p className="text-xs text-gray-300 -mt-1">Premium atirlar</p>
              </div>
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-8">
              {(isAuthenticated() ? authenticatedMenuItems : menuItems).map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="text-white hover:text-yellow-400 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 hover:bg-gray-900 cursor-pointer"
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Right side icons */}
          <div className="flex items-center space-x-4">
            {/* Cart Icon */}
            <Link href="/cart" className="text-white hover:text-yellow-400 transition-colors duration-200 p-2 rounded-full hover:bg-gray-900 relative cursor-pointer">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4m1.6 8L5 3H3m4 10v6a1 1 0 001 1h10a1 1 0 001-1v-6M9 19a1 1 0 100 2 1 1 0 000-2zm8 0a1 1 0 100 2 1 1 0 000-2z"
                />
              </svg>
              <span className="absolute -top-1 -right-1 bg-yellow-400 text-black text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                0
              </span>
            </Link>

            {/* Language Selector */}
            <div className="relative">
              <button
                onClick={() => setIsLanguageMenuOpen(!isLanguageMenuOpen)}
                className="flex items-center space-x-2 text-white hover:text-yellow-400 px-3 py-2 rounded-lg transition-colors duration-200 cursor-pointer border border-transparent hover:border-yellow-400"
              >
                <span className="text-lg">{language === 'uz' ? '🇺🇿' : '🇷🇺'}</span>
                <span className="hidden md:block text-sm font-medium">{language === 'uz' ? 'UZ' : 'RU'}</span>
                <svg className={`w-4 h-4 transition-transform duration-200 ${isLanguageMenuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

              {/* Language Dropdown */}
              {isLanguageMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-50 py-1">
                  <button
                    onClick={() => {
                      setLanguage('uz');
                      setIsLanguageMenuOpen(false);
                    }}
                    className={`w-full px-4 py-2 text-left hover:bg-gray-800 transition-colors duration-200 flex items-center space-x-3 ${language === 'uz' ? 'bg-gray-800 text-yellow-400' : 'text-white'}`}
                  >
                    <span className="text-lg">🇺🇿</span>
                    <span className="font-medium">O'zbek</span>
                    {language === 'uz' && (
                      <svg className="w-4 h-4 ml-auto text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setLanguage('ru');
                      setIsLanguageMenuOpen(false);
                    }}
                    className={`w-full px-4 py-2 text-left hover:bg-gray-800 transition-colors duration-200 flex items-center space-x-3 rounded-b-lg ${language === 'ru' ? 'bg-gray-800 text-yellow-400' : 'text-white'}`}
                  >
                    <span className="text-lg">🇷🇺</span>
                    <span className="font-medium">Русский</span>
                    {language === 'ru' && (
                      <svg className="w-4 h-4 ml-auto text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Login Button or Profile Icon */}
            {isAuthenticated() ? (
              <div className="flex items-center space-x-3">
                <div className="hidden md:flex flex-col text-right">
                  <span className="text-white text-sm font-medium">
                    {userProfile?.firstName} {userProfile?.lastName}
                  </span>
                  <span className="text-gray-300 text-xs">
                    {userProfile?.phoneNumber}
                  </span>
                </div>
                <Link href="/profil" className="relative group cursor-pointer">
                  <div className="w-10 h-10 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center text-black font-bold text-sm hover:shadow-yellow-400/50 hover:shadow-lg transition-all duration-300 border-2 border-white/20">
                    {userProfile?.firstName?.charAt(0) || user?.phoneNumber?.charAt(4) || 'U'}
                  </div>
                  <div className="absolute hidden group-hover:block bg-gray-900 text-white text-sm py-2 px-3 rounded-lg top-full right-0 mt-2 whitespace-nowrap shadow-lg border border-gray-700">
                    <div className="flex items-center space-x-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span>{t.profile}</span>
                    </div>
                  </div>
                </Link>
              </div>
            ) : (
              <button 
                onClick={() => setIsAuthModalOpen(true)}
                className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black px-4 py-2 rounded-full font-bold text-sm transition-all duration-200 transform hover:scale-105 shadow-lg cursor-pointer"
              >
                {t.login}
              </button>
            )}

            {/* Mobile menu button o'chirildi */}
            {/* <div className="md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-white hover:text-yellow-400 inline-flex items-center justify-center p-2 rounded-md transition-colors duration-200 cursor-pointer"
              >
                <svg
                  className={`${isMenuOpen ? 'hidden' : 'block'} h-6 w-6`}
                  stroke="currentColor"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
                <svg
                  className={`${isMenuOpen ? 'block' : 'hidden'} h-6 w-6`}
                  stroke="currentColor"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div> */}
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <div className={`md:hidden ${isMenuOpen ? 'block' : 'hidden'}`}>
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-gray-900">
          {(isAuthenticated() ? authenticatedMenuItems : menuItems).map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="text-white hover:text-yellow-400 block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 hover:bg-gray-800 cursor-pointer"
              onClick={() => setIsMenuOpen(false)}
            >
              {item.name}
            </Link>
          ))}
          
          {/* User actions in mobile menu */}
          {isAuthenticated() ? (
            <div className="border-t border-gray-700 pt-3 mt-3">
              <div className="px-3 py-2 text-white">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center text-black font-bold text-sm">
                    {userProfile?.firstName?.charAt(0) || user?.phoneNumber?.charAt(4) || 'U'}
                  </div>
                  <div>
                    <div className="font-medium text-sm">
                      {userProfile?.firstName} {userProfile?.lastName}
                    </div>
                    <div className="text-xs text-gray-300">
                      {userProfile?.phoneNumber}
                    </div>
                  </div>
                </div>
              </div>
              <Link 
                href="/profil" 
                className="text-white hover:text-yellow-400 block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 hover:bg-gray-800 cursor-pointer"
                onClick={() => setIsMenuOpen(false)}
              >
                Profilim
              </Link>
              <button 
                onClick={() => {
                  setIsMenuOpen(false);
                  logout();
                }}
                className="w-full text-left text-white hover:text-yellow-400 block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 hover:bg-gray-800 cursor-pointer"
              >
                Chiqish
              </button>
            </div>
          ) : (
            <button 
              onClick={() => {
                setIsMenuOpen(false);
                setIsAuthModalOpen(true);
              }}
              className="w-full text-left text-white hover:text-yellow-400 block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 hover:bg-gray-800 cursor-pointer"
            >
              Kirish
            </button>
          )}
        </div>
      </div>
      
      {/* Auth Modal */}
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </nav>
  );
} 