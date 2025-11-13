'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image'; // Import Image component
import { useAuth } from '../../contexts/AuthContext';
import { useOrder } from '../../contexts/OrderContext';
import { useLanguage } from '../../contexts/LanguageContext';

interface Order {
  id?: string;
  userId: string;
  productId: string;
  productName: string;
  productImage: string;
  size: string;
  price: number;
  quantity: number;
  totalPrice: number;
  status: 'pending' | 'confirmed' | 'delivered' | 'cancelled';
  customerInfo: {
    firstName: string;
    lastName: string;
    phoneNumber: string;
  };
  createdAt: string;
}

export default function BuyurtmalarimPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const { getUserOrders } = useOrder();
  const { t } = useLanguage();
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/');
      return;
    }

    const loadOrders = async () => {
      if (user && user.uid) {
        try {
          setIsLoading(true);
          const userOrders = await getUserOrders(user.uid);
          setOrders(userOrders);
        } catch (error) {
          console.error('❌ Buyurtmalarni yuklashda xatolik:', error);
          setOrders([]);
        } finally {
          setIsLoading(false);
        }
      } else {
        console.warn('⚠️ User yoki user.uid mavjud emas');
        setOrders([]);
        setIsLoading(false);
      }
    };

    loadOrders();
  }, [user, isAuthenticated, getUserOrders, router]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('uz-UZ').format(price) + ' so\'m';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return t.pending;
      case 'confirmed':
        return t.confirmed;
      case 'delivered':
        return t.delivered;
      case 'cancelled':
        return t.cancelled;
      default:
        return status;
    }
  };

  if (!isAuthenticated()) {
    return null;
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <main className="flex-1 flex flex-col py-8 pb-24 md:pb-12">
        <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t.myOrders}</h1>
          <p className="text-gray-600">{t.orderHistory}</p>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 text-lg">{t.loading}</p>
          </div>
        ) : orders.length > 0 ? (
          <div className="space-y-6">
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <Image 
                        src={order.productImage} 
                        alt={order.productName}
                        width={64}
                        height={64}
                        className="rounded-lg object-cover"
                      />
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{order.productName}</h3>
                        <p className="text-gray-600">{t.size}: {order.size}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(order.createdAt).toLocaleDateString('uz-UZ')} 
                          {' '}
                          {new Date(order.createdAt).toLocaleTimeString('uz-UZ', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(order.status)}`}>
                      {getStatusText(order.status)}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Miqdor:</span>
                      <span className="ml-2 font-medium text-gray-900">{order.quantity} dona</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Narx:</span>
                      <span className="ml-2 font-medium text-gray-900">{formatPrice(order.price)}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Jami:</span>
                      <span className="ml-2 font-bold text-yellow-600">{formatPrice(order.totalPrice)}</span>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
                    <div className="text-sm text-gray-600">
                      Buyurtma ID: {order.id}
                    </div>
                    <Link 
                      href={`/mahsulot/${order.productId}`}
                      className="text-yellow-600 hover:text-yellow-700 font-medium text-sm transition-colors"
                    >
                      {t.viewProduct} →
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">{t.noOrders}</h3>
            <p className="text-gray-500 mb-6">{t.noOrdersDesc}</p>
            <Link 
              href="/mahsulotlar"
              className="bg-yellow-400 hover:bg-yellow-500 text-black px-6 py-3 rounded-xl font-semibold transition-colors"
            >
              {t.products}
            </Link>
          </div>
        )}
        </div>
      </main>

      {/* Footer - asosiy sahifadagi footer bilan bir xil */}
      <footer className="bg-black text-white py-12 md:py-16 pb-20 md:pb-16 w-full mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Company Info (Logo and Name) */}
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <Image
                  src="/images/logo.png"
                  alt="Umar Perfume Logo"
                  width={40}
                  height={40}
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
                  <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.25 6.75c0 7.66 6.34 14 14 14h1.5a2.5 2.5 0 002.5-2.5v-2.12a1 1 0 00-.73-.97l-4.3-1.24a1 1 0 00-1.03.3l-.9 1.08a1 1 0 01-1.14.3 8.97 8.97 0 01-5.47-5.47 1 1 0 01.3-1.14l1.08-.9a1 1 0 00.3-1.03L7.34 3.48a1 1 0 00-.97-.73H4.25A2 2 0 002.25 4.75v2z" />
                  </svg>
                  <span>{t.phoneNumber}</span>
                </a>
                <a href={`https://www.instagram.com/${t.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-2 text-gray-400 hover:text-yellow-400 transition-colors cursor-pointer">
                  <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <rect width="18" height="18" x="3" y="3" rx="4" ry="4" />
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                    <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none" />
                  </svg>
                  <span>@{t.instagram}</span>
                </a>
                <a href={`https://t.me/${t.telegram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-2 text-gray-400 hover:text-yellow-400 transition-colors cursor-pointer">
                  <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M22.5 2.4L1.5 10.2c-.9.35-.89 1.66.02 2l5.3 1.95 2.13 6.68c.27.85 1.38 1.08 1.95.39l2.86-3.47 5.4 4.13c.7.53 1.72.13 1.9-.76L24 3.4c.2-.98-.73-1.77-1.5-1z" />
                  </svg>
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