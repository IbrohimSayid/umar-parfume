'use client';

import Link from 'next/link';
import Image from "next/image"; // Image komponentini import qilish
import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';

export default function Home() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { t } = useLanguage();
  const { isAuthenticated } = useAuth();

  // Firestore'dan mahsulotlarni olish
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "products"));
        const productsData: any[] = [];
        querySnapshot.forEach((doc) => {
          productsData.push({ id: doc.id, ...doc.data() });
        });
                  // Faqat 10 ta mahsulotni olish (asosiy sahifa uchun)
          const limitedProducts = productsData.slice(0, 10);
          setProducts(limitedProducts);
          console.log('✅ Client: Mahsulotlar olindi:', limitedProducts);
      } catch (error) {
        console.error('❌ Client: Mahsulotlarni olishda xatolik:', error);
        // Agar Firestore ishlamasa, demo ma'lumotlar
        setProducts([
          {
            id: 'demo1',
            name: "Demo Mahsulot",
            brand: "Demo Brand",
            price: "500,000",
            image: "https://images.unsplash.com/photo-1541643600914-78b084683601?w=300&h=400&fit=crop",
            description: "Demo mahsulot"
          }
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Auto slide
  useEffect(() => {
    if (products.length > 0) {
      const timer = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % Math.ceil(products.length / 4));
      }, 5000);
      return () => clearInterval(timer);
    }
  }, [products.length]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % Math.ceil(products.length / 4));
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + Math.ceil(products.length / 4)) % Math.ceil(products.length / 4));
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-black via-gray-900 to-black text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              <Image
                src="/logo.png" // Rasmingizning yo'li
                alt="Umar Perfume Logo" // Rasm uchun tavsif
                width={150} // Kenglik
                height={150} // Balandlik
                className="mx-auto mb-4"
              />
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-gray-300">
              {t.welcomeSubtitle}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/mahsulotlar">
                <button className="bg-yellow-400 text-black px-8 py-3 rounded-full font-semibold hover:bg-yellow-500 transition-colors duration-200 shadow-lg hover:shadow-yellow-400/30 cursor-pointer">
                  {t.products}
                </button>
              </Link>
              {/* "Biz haqimizda" tugmasi olib tashlandi */}
            </div>
          </div>
        </div>
      </section>

      {/* Mahsulotlar Slideri */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {t.featuredProducts}
            </h2>
            <p className="text-lg text-gray-600">
              {isLoading ? t.loading : t.welcomeSubtitle}
            </p>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">{t.loading}</p>
            </div>
          ) : products.length > 0 ? (
            <div className="relative">
              {/* Slider Container */}
              <div className="overflow-hidden">
                <div 
                  className="flex transition-transform duration-500 ease-in-out"
                  style={{ transform: `translateX(-${currentSlide * 100}%)` }}
                >
                  {Array.from({ length: Math.ceil(products.length / 4) }, (_, slideIndex) => (
                    <div key={slideIndex} className="w-full flex-shrink-0">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {products.slice(slideIndex * 4, (slideIndex + 1) * 4).map((product) => (
                          <Link key={product.id} href={`/mahsulot/${product.id}`} className="block">
                            <div className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 cursor-pointer">
                              <div className="aspect-w-3 aspect-h-4 bg-gray-200">
                                <img
                                  src={product.image}
                                  alt={product.name}
                                  className="w-full h-64 object-cover"
                                />
                              </div>
                              <div className="p-4">
                                <h3 className="text-lg font-semibold text-gray-900 mb-1">{product.name}</h3>
                                <p className="text-sm text-gray-600 mb-2">{product.brand}</p>
                                <p className="text-xs text-gray-500 mb-3">{product.description}</p>
                                <div className="flex justify-between items-center">
                                  <span className="text-xl font-bold text-yellow-600">{product.price} so'm</span>
                                  <button className="bg-black text-white px-3 py-1 rounded text-sm hover:bg-gray-800 transition-colors cursor-pointer">
                                    Ko'rish
                                  </button>
                                </div>
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Navigation Arrows */}
              {products.length > 4 && (
                <>
                  <button
                    onClick={prevSlide}
                    className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-4 bg-black text-white p-2 rounded-full hover:bg-gray-800 transition-colors cursor-pointer z-10"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={nextSlide}
                    className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-4 bg-black text-white p-2 rounded-full hover:bg-gray-800 transition-colors cursor-pointer z-10"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>

                  {/* Dots Indicator */}
                  <div className="flex justify-center mt-8 space-x-2">
                    {Array.from({ length: Math.ceil(products.length / 4) }, (_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentSlide(index)}
                        className={`w-3 h-3 rounded-full transition-colors cursor-pointer ${
                          currentSlide === index ? 'bg-yellow-600' : 'bg-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">Hech qanday mahsulot yo'q</h3>
              <p className="text-gray-500">Admin paneldan mahsulot qo'shing</p>
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {t.whyUmarPerfume}
            </h2>
            <p className="text-lg text-gray-600">
              {t.ourAdvantages}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="text-center p-6 rounded-lg hover:shadow-lg transition-shadow duration-200 border border-gray-100 bg-white cursor-pointer">
              <div className="w-16 h-16 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{t.premiumQualityTitle}</h3>
              <p className="text-gray-600">
                {t.premiumQualityDesc}
              </p>
            </div>

            {/* Feature 2 */}
            <div className="text-center p-6 rounded-lg hover:shadow-lg transition-shadow duration-200 border border-gray-100 bg-white cursor-pointer">
              <div className="w-16 h-16 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{t.affordablePriceTitle}</h3>
              <p className="text-gray-600">
                {t.affordablePriceDesc}
              </p>
            </div>

            {/* Feature 3 */}
            <div className="text-center p-6 rounded-lg hover:shadow-lg transition-shadow duration-200 border border-gray-100 bg-white cursor-pointer">
              <div className="w-16 h-16 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{t.fastDeliveryTitle}</h3>
              <p className="text-gray-600">
                {t.fastDeliveryDesc}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black text-white py-16 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Company Info (Logo and Name) */}
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <Image
                  src="/logo.png" // Rasmingizning yo'li
                  alt="Umar Perfume Logo" // Rasm uchun tavsif
                  width={40} // Kenglik
                  height={40} // Balandlik
                  className="rounded-lg shadow-lg"
                />
                <div>
                  <h3 className="text-xl font-bold">Umar Perfume</h3>
                  <p className="text-sm text-gray-400">Premium atirlar</p>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-lg font-semibold mb-4">{t.quickLinks}</h4>
              <ul className="space-y-2">
                <li><Link href="/" className="text-gray-400 hover:text-yellow-400 transition-colors cursor-pointer">{t.home}</Link></li>
                <li><Link href="/mahsulotlar" className="text-gray-400 hover:text-yellow-400 transition-colors cursor-pointer">{t.products}</Link></li>
                {isAuthenticated() && <li><Link href="/buyurtmalarim" className="text-gray-400 hover:text-yellow-400 transition-colors cursor-pointer">{t.orders}</Link></li>}
                {isAuthenticated() && <li><Link href="/profil" className="text-gray-400 hover:text-yellow-400 transition-colors cursor-pointer">{t.profile}</Link></li>}
              </ul>
            </div>

            {/* Contact Info */}
            <div>
              <h4 className="text-lg font-semibold mb-4">{t.contact}</h4>
              <div className="space-y-3">
                <a href={`tel:${t.phoneNumber.replace(/\s/g, '')}`} className="flex items-center space-x-2 text-gray-400 hover:text-yellow-400 transition-colors cursor-pointer">
                  <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 24 24"><path d="M20.003 14.6c-.33-.33-.77-.5-1.2-.5h-2.2c-.43 0-.87.17-1.2.5-.66.66-1.55 1.05-2.5 1.05-.95 0-1.84-.39-2.5-1.05-.66-.66-1.05-1.55-1.05-2.5 0-.95.39-1.84 1.05-2.5.33-.33.77-.5 1.2-.5h2.2c.43 0 .87-.17 1.2-.5.66-.66 1.05-1.55 1.05-2.5 0-.95-.39-1.84-1.05-2.5-.33-.33-.77-.5-1.2-.5h-2.2c-.43 0-.87.17-1.2.5-2.9 2.9-2.9 7.6 0 10.5 2.9 2.9 7.6 2.9 10.5 0 .33-.33.77-.5 1.2-.5h2.2c.43 0 .87-.17 1.2-.5.66-.66 1.05-1.55 1.05-2.5 0-.95-.39-1.84-1.05-2.5-.33-.33-.77-.5-1.2-.5h-2.2c-.43 0-.87.17-1.2-.5zm-4.4-7.4c.33-.33.77-.5 1.2-.5h2.2c.43 0 .87-.17 1.2-.5.66-.66 1.05-1.55 1.05-2.5 0-.95-.39-1.84-1.05-2.5-.33-.33-.77-.5-1.2-.5h-2.2c-.43 0-.87.17-1.2-.5-2.9-2.9-2.9-7.6 0-10.5 2.9-2.9 7.6-2.9 10.5 0 .33.33.77.5 1.2.5h2.2c.43 0 .87-.17 1.2-.5.66-.66 1.05-1.55 1.05-2.5 0-.95-.39-1.84-1.05-2.5-.33-.33-.77-.5-1.2-.5h-2.2c-.43 0-.87.17-1.2-.5zM.04 11.08L24 0 12.87 24 .04 11.08zM17.15 7.42l-5.63 5.34-1.57-1.49-3.15 3.03-3.08-1.78 12.03-12.03c.53-.53 1.39-.53 1.92 0 .53.53.53 1.39 0 1.92z"/></svg>
                  <span>{t.phoneNumber}</span>
                </a>
                <a href={`https://www.instagram.com/${t.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-2 text-gray-400 hover:text-yellow-400 transition-colors cursor-pointer">
                  <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 24 24"><path d="M7.05 0h9.9c1.92 0 3.49 1.57 3.49 3.49v9.9c0 1.92-1.57 3.49-3.49 3.49h-9.9c-1.92 0-3.49-1.57-3.49-3.49v-9.9c0-1.92 1.57-3.49 3.49-3.49zM12 11.23c-2.09 0-3.77 1.69-3.77 3.77s1.69 3.77 3.77 3.77 3.77-1.69 3.77-3.77-1.69-3.77-3.77-3.77zm4.27-5.75c-.53 0-.96.43-.96.96s.43.96.96.96.96-.43.96-.96-.43-.96-.96-.96z"/></svg>
                  <span>@{t.instagram}</span>
                </a>
                <a href={`https://t.me/${t.telegram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-2 text-gray-400 hover:text-yellow-400 transition-colors cursor-pointer">
                  <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 24 24"><path d="M.04 11.08L24 0 12.87 24 .04 11.08zM17.15 7.42l-5.63 5.34-1.57-1.49-3.15 3.03-3.08-1.78 12.03-12.03c.53-.53 1.39-.53 1.92 0 .53.53.53 1.39 0 1.92z"/></svg>
                  <span>@{t.telegram}</span>
                </a>
              </div>
            </div>
          </div>

          <hr className="border-gray-800 my-8" />
          
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              © 2024 Umar Perfume. Barcha huquqlar himoyalangan.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
