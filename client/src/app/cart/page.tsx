'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image'; // Import Image component
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import ConfirmModal from '../../components/ConfirmModal';
import SuccessModal from '../../components/SuccessModal';
import { db } from '../../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

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
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollButtons = useCallback(() => {
    const container = tableContainerRef.current;
    if (!container) {
      setCanScrollLeft(false);
      setCanScrollRight(false);
      return;
    }
    const { scrollLeft, clientWidth, scrollWidth } = container;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 1);
  }, []);

  useEffect(() => {
    // Load cart items from localStorage
    const storedCart = localStorage.getItem('cartItems');
    if (storedCart) {
      try {
        const parsedCart = JSON.parse(storedCart);
        setCartItems(parsedCart);
        const totalCount = Array.isArray(parsedCart)
          ? parsedCart.reduce((sum: number, item: CartItem) => sum + (item.quantity || 0), 0)
          : 0;
        window.dispatchEvent(new CustomEvent('cartUpdated', { detail: { count: totalCount } }));
      } catch {
        setCartItems([]);
      }
    }
    setIsLoading(false);
    updateScrollButtons();
  }, []);

  useEffect(() => {
    updateScrollButtons();
  }, [cartItems, isLoading, updateScrollButtons]);

  useEffect(() => {
    window.addEventListener('resize', updateScrollButtons);
    return () => window.removeEventListener('resize', updateScrollButtons);
  }, [updateScrollButtons]);

  const saveCartToLocalStorage = (items: CartItem[]) => {
    localStorage.setItem('cartItems', JSON.stringify(items));
    const totalCount = items.reduce((sum, item) => sum + (item.quantity || 0), 0);
    window.dispatchEvent(new CustomEvent('cartUpdated', { detail: { count: totalCount } }));
  };

  // Map of productId -> sizes array
  const [productSizesMap, setProductSizesMap] = useState<Record<string, Array<{ size: string; price: any; stock?: any }>>>({});

  // Load product sizes for items in cart
  useEffect(() => {
    const loadSizes = async () => {
      const ids = Array.from(new Set(cartItems.map(i => i.productId).filter(Boolean)));
      const map: Record<string, any> = { ...productSizesMap };
      for (const id of ids) {
        if (map[id]) continue;
        try {
          const ref = doc(db, "products", id);
          const snap = await getDoc(ref);
          if (snap.exists()) {
            const data: any = snap.data();
            map[id] = Array.isArray(data.sizes) ? data.sizes : [];
          } else {
            map[id] = [];
          }
        } catch (error) {
          console.error('Product sizes load error', error);
          map[id] = [];
        }
      }
      setProductSizesMap(map);
    };
    if (cartItems.length > 0) loadSizes();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartItems]);

  const parsePrice = (value: any) => {
    if (typeof value === 'number') return value;
    if (!value) return 0;
    const digits = String(value).replace(/[^\d]/g, '');
    return digits ? parseInt(digits) : 0;
  };

  const handleChangeSize = (itemId: string, newSize: string) => {
    const updated = cartItems.map(item => {
      if (item.id !== itemId) return item;
      const sizes = productSizesMap[item.productId] || [];
      const found = sizes.find((s: any) => String(s.size) === String(newSize));
      return {
        ...item,
        size: newSize,
        price: found ? parsePrice(found.price) : item.price
      };
    });
    setCartItems(updated);
    saveCartToLocalStorage(updated);
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
            <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="relative">
                <div
                  ref={tableContainerRef}
                  onScroll={updateScrollButtons}
                  className="overflow-x-auto scrollbar-hidden"
                >
                  <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        {t.products}
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        O'LCHAM
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        {t.price}
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        SONI
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        {t.total}
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Amallar
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {cartItems.map(item => (
                      <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-4">
                            <Image
                              src={item.productImage || '/images/logo.jpg'}
                              alt={item.productName}
                              width={64}
                              height={64}
                              className="w-16 h-16 rounded-xl object-cover border border-gray-200"
                            />
                            <div>
                              <p className="text-sm font-semibold text-gray-900">{item.productName}</p>
                              <Link href={`/mahsulot/${item.productId}`} className="text-xs text-yellow-600 hover:text-yellow-700">
                                Batafsil ko'rish
                              </Link>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {productSizesMap[item.productId] && productSizesMap[item.productId].length > 0 ? (
                            <select
                              value={item.size}
                              onChange={(e) => handleChangeSize(item.id, e.target.value)}
                              className="border border-gray-200 rounded-lg p-2 text-sm"
                            >
                              {productSizesMap[item.productId].map((s: any) => (
                                <option key={s.size} value={s.size}>
                                  {s.size}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span>{item.size}</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{formatPrice(item.price)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="w-8 h-8 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center hover:bg-gray-300 transition-colors"
                            >
                              -
                            </button>
                            <input
                              type="number"
                              min={1}
                              value={item.quantity}
                              onChange={(e) => updateQuantity(item.id, parseInt(e.target.value) || 1)}
                              className="w-16 border border-gray-300 rounded-lg text-center py-1"
                            />
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="w-8 h-8 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center hover:bg-gray-300 transition-colors"
                            >
                              +
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                          {formatPrice(item.price * item.quantity)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                          <button
                            onClick={() => removeItem(item.id)}
                            className="text-red-500 hover:text-red-600 transition-colors font-medium"
                          >
                            O'chirish
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
                {canScrollLeft && (
                  <button
                    type="button"
                    onClick={() => tableContainerRef.current?.scrollBy({ left: -320, behavior: 'smooth' })}
                    className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white p-2 rounded-full shadow-lg transition-colors"
                    aria-label="Oldingi mahsulotlar"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                )}
                {canScrollRight && (
                  <button
                    type="button"
                    onClick={() => tableContainerRef.current?.scrollBy({ left: 320, behavior: 'smooth' })}
                    className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white p-2 rounded-full shadow-lg transition-colors"
                    aria-label="Keyingi mahsulotlar"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                )}
              </div>
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