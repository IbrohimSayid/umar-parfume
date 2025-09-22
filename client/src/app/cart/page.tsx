'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image'; // Import Image component
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import ConfirmModal from '../../components/ConfirmModal';
import SuccessModal from '../../components/SuccessModal';

interface CartItem {
  id: string;
  productId: string;
  productName: string;
  productImage: string;
  size: string;
  price: number;
  quantity: number;
}

export default function CartPage() {
  const { t } = useLanguage();
  const { isAuthenticated } = useAuth();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    type: 'info' as 'info' | 'warning' | 'error' | 'success'
  });
  const [successModal, setSuccessModal] = useState({
    isOpen: false,
    title: '',
    message: ''
  });

  useEffect(() => {
    // Load cart items from localStorage
    const storedCart = localStorage.getItem('cartItems');
    if (storedCart) {
      setCartItems(JSON.parse(storedCart));
    }
    setIsLoading(false);
  }, []);

  const saveCartToLocalStorage = (items: CartItem[]) => {
    localStorage.setItem('cartItems', JSON.stringify(items));
  };

  const updateQuantity = (id: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    const updatedCart = cartItems.map(item => 
      item.id === id ? { ...item, quantity: newQuantity } : item
    );
    setCartItems(updatedCart);
    saveCartToLocalStorage(updatedCart);
  };

  const removeItem = (id: string) => {
    const updatedCart = cartItems.filter(item => item.id !== id);
    setCartItems(updatedCart);
    saveCartToLocalStorage(updatedCart);
    showSuccessModal('Mahsulot o\'chirildi', 'Mahsulot savatdan muvaffaqiyatli o\'chirildi.');
  };

  const calculateTotal = () => {
    return cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('uz-UZ').format(price) + ' so\'m';
  };

  const showConfirmModal = (title: string, message: string, onConfirm: () => void, type: 'info' | 'warning' | 'error' | 'success') => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      onConfirm,
      type
    });
  };

  const closeConfirmModal = () => {
    setConfirmModal({ ...confirmModal, isOpen: false });
  };

  const showSuccessModal = (title: string, message: string) => {
    setSuccessModal({
      isOpen: true,
      title,
      message
    });
  };

  const closeSuccessModal = () => {
    setSuccessModal({ ...successModal, isOpen: false });
  };

  const handleCheckout = () => {
    if (!isAuthenticated()) {
      showConfirmModal(t.loginRequired, 'Buyurtma berish uchun avval tizimga kirishingiz kerak.', () => {}, 'info');
      return;
    }
    if (cartItems.length === 0) {
      showConfirmModal('Savat bo\'sh', 'Savatda hech qanday mahsulot yo\'q.', () => {}, 'warning');
      return;
    }

    // Bu yerda Checkout sahifasiga yo'naltirish yoki buyurtma berish logikasi bo'ladi
    showConfirmModal('Buyurtmani rasmiylashtirish', 'Sizni buyurtmani rasmiylashtirish sahifasiga yo\'naltiramiz.', () => {
      // router.push('/checkout'); // Agar checkout sahifasi mavjud bo'lsa
      showSuccessModal('Muvaffaqiyatli', 'Buyurtmangiz rasmiylashtirildi. Tez orada siz bilan bog\'lanamiz!');
      setCartItems([]);
      saveCartToLocalStorage([]);
    }, 'success');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">{t.loading}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 py-8 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">{t.cart}</h1>

        {cartItems.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.767.707 1.767H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">{t.emptyCart}</h3>
            <p className="text-gray-500 mb-6">{t.emptyCartDesc}</p>
            <Link href="/mahsulotlar" className="bg-yellow-400 hover:bg-yellow-500 text-black px-6 py-3 rounded-xl font-semibold transition-colors">
              {t.products}
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              {cartItems.map(item => (
                <div key={item.id} className="flex items-center bg-white rounded-2xl shadow-lg p-5 border border-gray-100">
                  <Image src={item.productImage} alt={item.productName} width={96} height={96} className="w-24 h-24 object-cover rounded-xl mr-5" />
                  <div className="flex-grow">
                    <h3 className="text-lg font-semibold text-gray-900">{item.productName}</h3>
                    <p className="text-gray-600 text-sm">{t.size}: {item.size}</p>
                    <p className="text-yellow-600 font-medium mt-1">{formatPrice(item.price)}</p>
                    <div className="flex items-center mt-3">
                      <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="bg-gray-200 text-gray-700 w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-300 transition-colors">-</button>
                      <span className="mx-3 font-semibold text-gray-900">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="bg-gray-200 text-gray-700 w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-300 transition-colors">+</button>
                      <button onClick={() => removeItem(item.id)} className="ml-auto text-red-500 hover:text-red-700 transition-colors">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="lg:col-span-1 bg-white rounded-2xl shadow-lg p-6 border border-gray-100 h-fit">
              <h2 className="text-2xl font-bold text-gray-900 mb-5">{t.cartSummary}</h2>
              <div className="flex justify-between items-center text-gray-700 mb-3">
                <span>{t.totalProducts} ({cartItems.length}):</span>
                <span className="font-semibold">{formatPrice(calculateTotal())}</span>
              </div>
              <div className="flex justify-between items-center text-gray-700 mb-5">
                <span>{t.delivery}:</span>
                <span className="font-semibold">{t.free}</span>
              </div>
              <div className="flex justify-between items-center text-xl font-bold text-gray-900 border-t border-gray-200 pt-5">
                <span>{t.total}:</span>
                <span>{formatPrice(calculateTotal())}</span>
              </div>
              <button
                onClick={handleCheckout}
                className="w-full bg-yellow-400 hover:bg-yellow-500 text-black px-6 py-3 rounded-xl font-semibold transition-colors mt-6 disabled:opacity-50"
                disabled={cartItems.length === 0}
              >
                {t.checkout}
              </button>
            </div>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={closeConfirmModal}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type}
      />
      
      <SuccessModal
        isOpen={successModal.isOpen}
        onClose={closeSuccessModal}
        title={successModal.title}
        message={successModal.message}
      />
    </div>
  );
} 