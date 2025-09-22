'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { db } from '../../../lib/firebase';
import { doc, getDoc, collection, getDocs, query, where, limit } from 'firebase/firestore';
import { useAuth } from '../../../contexts/AuthContext';
import { useOrder } from '../../../contexts/OrderContext';
import ConfirmModal from '../../../components/ConfirmModal';
import SuccessModal from '../../../components/SuccessModal';
import AuthModal from '../../../components/AuthModal';
import SignupRequiredModal from '../../../components/SignupRequiredModal';
import Image from 'next/image'; // Import Image component

interface ProductSize {
  size: string;
  price: number;
  stock?: string | number;
  imageName: string;
}

interface Product {
  id: string;
  name: string;
  brand: string;
  price: string;
  stock: number;
  status: string;
  sizes: ProductSize[];
  image: string;
  category: string;
  fragrance_notes: string[];
  description: string;
  createdAt: string;
}

export default function MahsulotPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;
  
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [selectedSize, setSelectedSize] = useState<ProductSize | null>(null);
  // const [currentImageIndex, setCurrentImageIndex] = useState(0);
  // const [setCurrentImageIndex, setCurrentImageIndex] = useState(0); // Ishlatilmagan
  const [isLoading, setIsLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [imageLoading, setImageLoading] = useState(false);

  // Auth and Order hooks
  const { user, userProfile, isAuthenticated } = useAuth();
  const { createOrder /* , loading: orderLoading */ } = useOrder();

  // Modal states
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

  const [authModal, setAuthModal] = useState(false);
  const [signupRequiredModal, setSignupRequiredModal] = useState(false);

  // Firebase'dan mahsulot ma'lumotlarini olish
  useEffect(() => {
    const fetchProduct = async () => {
      if (!productId) return;
      
      setIsLoading(true);
      try {
        // Asosiy mahsulotni olish
        const productDoc = await getDoc(doc(db, "products", productId));
        
        if (productDoc.exists()) {
          const productData = { id: productDoc.id, ...productDoc.data() } as Product;
          setProduct(productData);
          
          // Default o'lcham tanlash
          if (productData.sizes && productData.sizes.length > 0) {
            setSelectedSize(productData.sizes[0]);
          }
          
          // O'xshash mahsulotlarni olish
          try {
            const relatedQuery = query(
              collection(db, "products"),
              where("category", "==", productData.category || "erkak"),
              limit(4)
            );
            const relatedSnapshot = await getDocs(relatedQuery);
            const relatedData: Product[] = [];
            
            relatedSnapshot.forEach((doc) => {
              if (doc.id !== productId) {
                relatedData.push({ id: doc.id, ...doc.data() } as Product);
              }
            });
            
            setRelatedProducts(relatedData);
          } catch (relatedError) {
            console.error('O\'xshash mahsulotlarni olishda xatolik:', relatedError);
          }
          
          console.log('✅ Mahsulot ma\'lumotlari olindi:', productData);
        } else {
          console.error('❌ Mahsulot topilmadi');
        }
      } catch (error) {
        console.error('❌ Mahsulotni olishda xatolik:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProduct();
  }, [productId]);

  const formatPrice = (price: string | number) => {
    const numPrice = typeof price === 'string' ? parseInt(price.replace(/[^\d]/g, '') || '0') : price;
    return new Intl.NumberFormat('uz-UZ').format(numPrice) + ' so\'m';
  };

  // O'lcham uchun rasm olish funksiyasi
  const getSizeImage = (size: ProductSize) => {
    if (!size) return product?.image;
    
    // O'lcham bo'yicha turli xil Unsplash rasm ID'lari
    const imageIds: { [key: string]: string } = {
      '5': '1541643600914-78b084683601',     // Kichik shisha
      '10': '1594736797933-d0501ba2fe65',    // O'rta shisha
      '30': '1615634260167-c8cdede054de',    // Katta shisha
      '50': '1571781926291-c477dae4ca21',    // Katta shisha 2
      '100': '1615634260167-c8cdede054de',   // Eng katta shisha
      'Full': '1594736797933-d0501ba2fe65'   // To'liq o'lcham
    };
    
    const imageId = imageIds[size.size] || '1541643600914-78b084683601';
    return `https://images.unsplash.com/${imageId}?w=400&h=500&fit=crop&auto=format&q=80`;
  };

  // Modal functions
  const showConfirmModal = (title: string, message: string, onConfirm: () => void, type: 'info' | 'warning' | 'error' | 'success' = 'info') => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      onConfirm,
      type
    });
  };

  const showSuccessModal = (title: string, message: string) => {
    setSuccessModal({
      isOpen: true,
      title,
      message
    });
  };

  const closeConfirmModal = () => {
    setConfirmModal({
      isOpen: false,
      title: '',
      message: '',
      onConfirm: () => {},
      type: 'info'
    });
  };

  const closeSuccessModal = () => {
    setSuccessModal({
      isOpen: false,
      title: '',
      message: ''
    });
  };

  const handleAddToCart = () => {
    if (!isAuthenticated()) {
      showConfirmModal(
        'Tizimga kirish kerak',
        'Savatga qo\'shish uchun avval tizimga kirish kerak.',
        () => {},
        'info'
      );
      return;
    }

    if (!selectedSize) {
      showConfirmModal(
        'O\'lcham tanlang',
        'Iltimos, avval mahsulot o\'lchamini tanlang.',
        () => {},
        'warning'
      );
      return;
    }
    
    // Savatga qo'shish funksiyasi - keyinroq qo'shiladi
    showSuccessModal(
      'Savatga qo\'shildi!',
      `${product?.name} (${selectedSize.size}) savatga muvaffaqiyatli qo'shildi!`
    );
  };

  const handleBuyNow = () => {
    if (!isAuthenticated()) {
      // Ro'yxatdan o'tmagan foydalanuvchi uchun signup modal ko'rsatish
      setSignupRequiredModal(true);
      return;
    }

    if (!selectedSize) {
      showConfirmModal(
        'O\'lcham tanlang',
        'Iltimos, avval mahsulot o\'lchamini tanlang.',
        () => {},
        'warning'
      );
      return;
    }

    if (!userProfile) {
      showConfirmModal(
        'Profil ma\'lumotlari yo\'q',
        'Buyurtma berish uchun profil ma\'lumotlari kerak.',
        () => {},
        'error'
      );
      return;
    }

    const orderData = {
      userId: user!.uid,
      productId: product!.id,
      productName: product!.name,
      productImage: product!.image,
      size: selectedSize.size,
      price: typeof selectedSize.price === 'string' 
        ? parseInt((selectedSize.price as string).replace(/[^\d]/g, '') || '0') 
        : (selectedSize.price as number),
      quantity: quantity,
      totalPrice: (typeof selectedSize.price === 'string' 
        ? parseInt((selectedSize.price as string).replace(/[^\d]/g, '') || '0') 
        : (selectedSize.price as number)) * quantity,
      customerInfo: {
        firstName: userProfile.firstName || '',
        lastName: userProfile.lastName || '',
        phoneNumber: userProfile.phoneNumber || ''
      }
    };

    showConfirmModal(
      'Buyurtmani tasdiqlang',
      `${product?.name} (${selectedSize.size}) - ${quantity} dona\nJami: ${formatPrice(orderData.totalPrice)}\n\nBuyurtmani bermoqchimisiz?`,
      async () => {
        const success = await createOrder(orderData);
        if (success) {
          showSuccessModal(
            'Buyurtma berildi!',
            'Sizning buyurtmangiz muvaffaqiyatli qabul qilindi. Tez orada siz bilan bog\'lanamiz!\n\n2 sekund ichida "Buyurtmalarim" sahifasiga yo\'naltirilasiz...'
          );
          // 2 sekund kutib buyurtmalar sahifasiga yo'naltirish
          setTimeout(() => {
            router.push('/buyurtmalarim');
          }, 2000);
        }
      },
      'info'
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Mahsulot yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Mahsulot topilmadi</h1>
          <p className="text-gray-600 mb-6">Kechirasiz, siz qidirayotgan mahsulot mavjud emas</p>
          <Link href="/mahsulotlar" className="bg-yellow-400 text-black px-6 py-3 rounded-lg font-semibold hover:bg-yellow-500 transition-colors">
            Mahsulotlar sahifasiga qaytish
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex items-center space-x-2 text-sm">
            <Link href="/" className="text-gray-500 hover:text-yellow-600 transition-colors">Bosh sahifa</Link>
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <Link href="/mahsulotlar" className="text-gray-500 hover:text-yellow-600 transition-colors">Mahsulotlar</Link>
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span className="text-gray-900 font-medium">{product.name}</span>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Left side - Images */}
          <div className="space-y-6">
            {/* Main Image */}
            <div className="aspect-w-4 aspect-h-5 bg-white rounded-2xl shadow-xl overflow-hidden relative">
              {imageLoading && (
                <div className="absolute inset-0 bg-gray-100 flex items-center justify-center z-10">
                  <div className="w-8 h-8 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
              
              <Image 
                src={selectedSize ? 
                  (getSizeImage(selectedSize) || '') : // undefined bo'lsa bo'sh string
                  (product?.image || '') // undefined bo'lsa bo'sh string
                } 
                alt={`${product.name} - ${selectedSize?.size || 'asosiy'}`}
                width={500} // Example width, adjust as needed
                height={500} // Example height, adjust as needed
                className={`w-full h-96 object-cover transition-all duration-500 ${imageLoading ? 'opacity-0' : 'opacity-100'}`}
                onLoad={() => setImageLoading(false)}
                onLoadingComplete={() => setImageLoading(false)}
                onError={() => {
                  // e.currentTarget.src = 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=400&h=500&fit=crop&auto=format&q=80';
                }}
              />
              
              {/* O'lcham ko'rsatkichi */}
              {selectedSize && (
                <div className="absolute top-4 left-4 bg-black/70 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm font-medium shadow-lg">
                  📏 {selectedSize.size}
                </div>
              )}
              
              {/* Narx ko'rsatkichi rasmda */}
              {selectedSize && (
                <div className="absolute bottom-4 right-4 bg-yellow-400/90 backdrop-blur-sm text-black px-3 py-1 rounded-full text-sm font-bold shadow-lg">
                  💰 {formatPrice(selectedSize.price)}
                </div>
              )}
            </div>

            {/* Product Features */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Mahsulot hususiyatlari</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-600">Original mahsulot</span>
                </div>
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-gray-600">Tez yetkazib berish</span>
                </div>
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-gray-600">Kafolat bilan</span>
                </div>
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                  <span className="text-gray-600">To&apos;lov xavfsiz</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right side - Product Info */}
          <div className="space-y-6">
            {/* Product Title and Brand */}
            <div className="bg-white rounded-2xl shadow-lg p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-base font-bold text-yellow-600">{product.brand}</span>
                <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                  product.category === 'erkak' ? 'bg-blue-100 text-blue-800' :
                  product.category === 'ayol' ? 'bg-pink-100 text-pink-800' :
                  'bg-purple-100 text-purple-800'
                }`}>
                  {product.category === 'erkak' ? 'Erkaklar uchun' : 
                   product.category === 'ayol' ? 'Ayollar uchun' : 'Barcha uchun'}
                </span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-4">{product.name}</h1>
              
              {/* Price */}
              <div className="text-2xl font-bold text-gray-900 mb-2">
                {selectedSize ? formatPrice(selectedSize.price) : formatPrice(product.price)}
              </div>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span className={`px-2 py-1 rounded-full text-xs ${
                  (selectedSize ? (parseInt(selectedSize.stock as string) || 0) : product.stock) > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {(selectedSize ? (parseInt(selectedSize.stock as string) || 0) : product.stock) > 0 ? 
                    `${selectedSize ? (parseInt(selectedSize.stock as string) || 0) : product.stock} dona mavjud` : 
                    'Mavjud emas'
                  }
                </span>
              </div>
            </div>

            {/* Description */}
            <div className="bg-white rounded-2xl shadow-lg p-5">
              <h3 className="text-lg font-bold text-gray-900 mb-3">Tavsif</h3>
              <p className="text-gray-600 leading-relaxed text-sm">{product.description}</p>
            </div>

            {/* Fragrance Notes */}
            {product.fragrance_notes && product.fragrance_notes.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg p-5">
                <h3 className="text-lg font-bold text-gray-900 mb-3">Hid notalari</h3>
                <div className="flex flex-wrap gap-2">
                  {product.fragrance_notes.map((note, index) => (
                    <span key={index} className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full border border-yellow-200">
                      {note}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Size Selection */}
            {product.sizes && product.sizes.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg p-5">
                <h3 className="text-lg font-bold text-gray-900 mb-3">O&apos;lcham tanlang</h3>
                <div className="grid grid-cols-3 gap-3">
                  {product.sizes.map((size, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setImageLoading(true);
                        setSelectedSize(size);
                        // Quantity ni tanlangan o'lcham stock'iga moslash
                        const maxStock = parseInt(size.stock as string) || 0;
                        if (quantity > maxStock) {
                          setQuantity(Math.max(1, maxStock));
                        }
                      }}
                      className={`p-3 border-2 rounded-xl text-center transition-all duration-200 transform hover:scale-105 ${
                        selectedSize?.size === size.size
                          ? 'border-yellow-400 bg-yellow-50 text-yellow-800 shadow-lg scale-105'
                          : 'border-gray-200 hover:border-gray-300 hover:shadow-md text-gray-800'
                      }`}
                    >
                      <div className="font-bold text-base">{size.size}</div>
                      <div className="text-xs text-gray-600 mt-1">
                        {formatPrice(size.price)}
                      </div>
                      <div className={`text-xs mt-1 ${
                        (parseInt(size.stock as string) || 0) > 0 ? 'text-green-600' : 'text-red-500'
                      }`}>
                        {(parseInt(size.stock as string) || 0) > 0 ? 
                          `✅ ${parseInt(size.stock as string) || 0} dona` : 
                          '❌ Tugagan'
                        }
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div className="bg-white rounded-2xl shadow-lg p-5">
              <h3 className="text-lg font-bold text-gray-900 mb-3">Miqdor</h3>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-8 h-8 border-2 border-gray-300 rounded-lg flex items-center justify-center hover:border-yellow-400 transition-colors text-gray-800 font-bold text-sm"
                >
                  -
                </button>
                <span className="text-lg font-bold text-gray-900 w-10 text-center">{quantity}</span>
                <button
                  onClick={() => {
                    const maxStock = selectedSize ? (parseInt(selectedSize.stock as string) || 0) : product.stock;
                    setQuantity(Math.min(maxStock, quantity + 1));
                  }}
                  disabled={quantity >= (selectedSize ? (parseInt(selectedSize.stock as string) || 0) : product.stock)}
                  className="w-8 h-8 border-2 border-gray-300 rounded-lg flex items-center justify-center hover:border-yellow-400 transition-colors disabled:opacity-50 text-gray-800 font-bold text-sm"
                >
                  +
                </button>
                <span className="text-xs text-gray-600">
                  (Maksimum: {selectedSize ? (parseInt(selectedSize.stock as string) || 0) : product.stock} dona)
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="bg-white rounded-2xl shadow-lg p-5">
              <div className="space-y-3">
                <button 
                  onClick={handleBuyNow}
                  disabled={(selectedSize ? (parseInt(selectedSize.stock as string) || 0) : product.stock) === 0}
                  className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black py-3 rounded-xl font-bold text-base transition-all duration-200 transform hover:scale-[1.02] shadow-lg disabled:opacity-50 disabled:transform-none"
                >
                  {(selectedSize ? (parseInt(selectedSize.stock as string) || 0) : product.stock) > 0 ? 'Hoziroq sotib olish' : 'Mavjud emas'}
                </button>
                <button 
                  onClick={handleAddToCart}
                  disabled={(selectedSize ? (parseInt(selectedSize.stock as string) || 0) : product.stock) === 0}
                  className="w-full bg-gray-800 text-white py-3 rounded-xl font-bold text-base hover:bg-gray-700 transition-all duration-200 disabled:opacity-50"
                >
                  Savatga qo&apos;shish
                </button>
              </div>
              
              {selectedSize && (
                <div className="mt-3 p-3 bg-gray-50 rounded-xl">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-700">Tanlangan o&apos;lcham:</span>
                    <span className="font-semibold text-gray-900">{selectedSize.size}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs mt-1">
                    <span className="text-gray-700">Narx:</span>
                    <span className="font-semibold text-gray-900">{formatPrice(selectedSize.price)}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs mt-1">
                    <span className="text-gray-700">Miqdor:</span>
                    <span className="font-semibold text-gray-900">{quantity} dona</span>
                  </div>
                  <hr className="my-2" />
                  <div className="flex justify-between items-center font-bold text-sm">
                    <span className="text-gray-900">Jami:</span>
                    <span className="text-base text-yellow-600">
                      {formatPrice(
                        (typeof selectedSize.price === 'string' ? 
                          parseInt((selectedSize.price as string).replace(/[^\d]/g, '') || '0') : 
                          (selectedSize.price as number)) * quantity
                      )}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">O&apos;xshash mahsulotlar</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((relatedProduct) => (
                <Link key={relatedProduct.id} href={`/mahsulot/${relatedProduct.id}`}>
                  <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer transform hover:scale-[1.02]">
                    <div className="aspect-w-3 aspect-h-4 bg-gray-200">
                      <Image 
                        src={relatedProduct.image || ''} // undefined bo'lsa bo'sh string
                        alt={relatedProduct.name}
                        width={192} // 48 * 4
                        height={192} // 48 * 4
                        className="w-full h-48 object-cover"
                        onError={() => {
                          // e.currentTarget.src = 'https://picsum.photos/300/400?random=related';
                        }}
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-gray-900 mb-1">{relatedProduct.name}</h3>
                      <p className="text-gray-600 text-sm mb-2">{relatedProduct.brand}</p>
                      <p className="font-bold text-yellow-600 text-lg">
                        {formatPrice(relatedProduct.price)}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* Modals */}
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

      {/* Signup Required Modal */}
      <SignupRequiredModal
        isOpen={signupRequiredModal}
        onClose={() => setSignupRequiredModal(false)}
        onSignup={() => {
          setSignupRequiredModal(false);
          setAuthModal(true);
        }}
      />

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModal}
        onClose={() => setAuthModal(false)}
        onSuccess={() => {
          setAuthModal(false);
          // Muvaffaqiyatli ro'yxatdan o'tgandan keyin avtomatik buyurtma berish
          setTimeout(() => {
            handleBuyNow();
          }, 500);
        }}
      />
    </div>
  );
} 