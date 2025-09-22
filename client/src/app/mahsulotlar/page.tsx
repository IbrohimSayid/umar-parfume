'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image'; // Import Image component
import { useAuth } from '../../contexts/AuthContext';
import AuthModal from '../../components/AuthModal';
import LoginModal from '../../components/LoginModal';
import { db } from '../../lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { useLanguage } from '../../contexts/LanguageContext';

export interface ProductSize {
  size: string;
  price: number;
  stock?: string | number;
  image: string;
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  sizes: ProductSize[];
  image: string;
  category: 'erkak' | 'ayol';
  fragrance_notes: string[];
  description: string;
  price: string;
  stock: number;
  status: string;
}

// Available brands and fragrance notes
const availableBrands = [
  'Chanel', 'Dior', 'Lancôme', 'Yves Saint Laurent', 'Paco Rabanne', 
  'Carolina Herrera', 'Tom Ford', 'Versace', 'Giorgio Armani', 'Dolce & Gabbana'
];

const availableFragranceNotes = [
  'Sitrus mevalar', 'Darx notalari', 'Gul notalari', 'Yog\'och notalari',
  'Musk', 'Vanila', 'Bergamot', 'Jasmin', 'Sandalwood', 'Patchouli',
  'Lavanda', 'Mint', 'Qora murch', 'Amber', 'Oud', 'Limon',
  'Atirgul', 'Yasemin', 'Seder darxi', 'Tonka loviya'
];

export default function MahsulotlarPage() {
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'erkak' | 'ayol'>('all');
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedFragranceNotes, setSelectedFragranceNotes] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);

  const { isAuthenticated } = useAuth();
  const { t } = useLanguage();

  // Firebase'dan mahsulotlarni olish
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "products"));
        const productsData: Product[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          productsData.push({
            id: doc.id,
            name: data.name || '',
            brand: data.brand || '',
            price: data.price || '0',
            image: data.image || 'https://picsum.photos/300/400?random=noimage',
            description: data.description || '',
            stock: data.stock || 0,
            status: data.status || 'mavjud',
                        // Default qiymatlar
            sizes: data.sizes || [{ size: '50ml', price: parseInt(data.price?.replace(/[^\d]/g, '') || '0'), image: data.image || '' }],
            category: data.category || 'erkak',
            fragrance_notes: data.fragrance_notes || []
          });
        });
        setProducts(productsData);
        console.log('✅ Client: Mahsulotlar olindi:', productsData);
      } catch (error) {
        console.error('❌ Client: Mahsulotlarni olishda xatolik:', error);
        setProducts([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Handle buy now button click
  const handleBuyNow = () => {
    if (isAuthenticated()) {
      // User is authenticated, redirect to product page
      // window.location.href = `/mahsulot/${productId}`;
      alert(t.buyNowSuccess);
    } else {
      // User is not authenticated, show auth modal
      setShowAuthModal(true);
    }
  };

  // Handle add to cart button click
  const handleAddToCart = () => {
    if (isAuthenticated()) {
      // Add to cart logic here
      alert(t.addToCartSuccess);
    } else {
      // User is not authenticated, show auth modal
      setShowAuthModal(true);
    }
  };

  // Handle successful authentication
  const handleAuthSuccess = () => {
    alert(t.profileUpdateSuccess);
  };

  // Switch between modals
  // const handleSwitchToLogin = () => {
  //   setShowAuthModal(false);
  //   setShowLoginModal(true);
  // };

  const handleSwitchToRegister = () => {
    setShowLoginModal(false);
    setShowAuthModal(true);
  };

  // Handle brand selection
  const handleBrandChange = (brand: string) => {
    setSelectedBrands(prev => 
      prev.includes(brand) 
        ? prev.filter(b => b !== brand)
        : [...prev, brand]
    );
  };

  // Handle fragrance notes selection
  const handleFragranceNoteChange = (note: string) => {
    setSelectedFragranceNotes(prev => 
      prev.includes(note) 
        ? prev.filter(n => n !== note)
        : [...prev, note]
    );
  };

  // Filter products based on selected filters
  const filteredProducts = products.filter(product => {
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.brand.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Price range filter
    const min = minPrice ? parseInt(minPrice.replace(/[^\d]/g, '')) : 0;
    const max = maxPrice ? parseInt(maxPrice.replace(/[^\d]/g, '')) : Infinity;
    const productPrice = parseInt(product.price.replace(/[^\d]/g, '') || '0');
    const matchesPrice = productPrice >= min && productPrice <= max;
    
    // Brand filter
    const matchesBrand = selectedBrands.length === 0 || selectedBrands.includes(product.brand);
    
    // Fragrance notes filter
    const matchesFragranceNotes = selectedFragranceNotes.length === 0 || 
      selectedFragranceNotes.some(note => product.fragrance_notes.includes(note));

    return matchesCategory && matchesSearch && matchesPrice && matchesBrand && matchesFragranceNotes;
  });

  const formatPrice = (price: string) => {
    const number = parseInt(price.replace(/[^\d]/g, '') || '0');
    return new Intl.NumberFormat('uz-UZ').format(number) + ' so\'m';
  };

  const formatPriceInput = (value: string) => {
    const number = value.replace(/[^\d]/g, '');
    return new Intl.NumberFormat('uz-UZ').format(parseInt(number) || 0);
  };

  const handlePriceInputChange = (value: string, setter: (value: string) => void) => {
    const formattedValue = formatPriceInput(value);
    setter(formattedValue);
  };

  const handleApplyFilters = () => {
    setIsFilterMenuOpen(false);
  };

  const handleClearFilters = () => {
    setSelectedCategory('all');
    setMinPrice('');
    setMaxPrice('');
    setSelectedBrands([]);
    setSelectedFragranceNotes([]);
    setSearchTerm('');
  };

  return (
    <div className="bg-gray-50 pb-20">
      {/* Page Header */}
      <div className="bg-black text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-bold text-center mb-4">
            <span className="bg-gradient-to-r from-white to-yellow-400 bg-clip-text text-transparent">
              {t.products}
            </span>
          </h1>
          <p className="text-xl text-gray-300 text-center">
            {t.welcomeSubtitle}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-20">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">{t.products}</h1>

        {/* Mobile Filter Button */}
        <div className="md:hidden flex justify-end mb-4">
          <button 
            onClick={() => setIsFilterMenuOpen(true)}
            className="bg-yellow-400 text-black px-4 py-2 rounded-xl font-semibold flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM5 10a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H6a1 1 0 01-1-1v-2zM7 16a1 1 0 011-1h8a1 1 0 011 1v2a1 1 0 01-1 1H8a1 1 0 01-1-1v-2z" />
            </svg>
            <span>{t.filter}</span>
          </button>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Filters Sidebar */}
          <div className={`fixed inset-0 bg-black/60 z-40 md:static md:bg-transparent
            ${isFilterMenuOpen ? 'block' : 'hidden'} md:block`}
          >
            <div className={`bg-white w-80 h-full p-6 md:p-0 shadow-lg md:shadow-none
              ${isFilterMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0
              transform transition-transform duration-300 ease-in-out md:relative md:h-auto md:w-auto`}
            >
              {/* Mobile Filter Header */}
              <div className="md:hidden flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">{t.filter}</h2>
                <button onClick={() => setIsFilterMenuOpen(false)} className="text-gray-600 hover:text-gray-900">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="md:w-64 space-y-8 bg-white p-6 rounded-2xl shadow-lg border border-gray-100 md:block">
              {/* Category Filter */}
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">{t.categories}</h3>
                  <div className="space-y-2">
                    <label className="flex items-center text-gray-700">
                      <input
                        type="radio"
                        name="category"
                        value="all"
                        checked={selectedCategory === 'all'}
                        onChange={() => setSelectedCategory('all')}
                        className="form-radio text-yellow-500"
                      />
                      <span className="ml-2">Barchasi</span>
                    </label>
                    <label className="flex items-center text-gray-700">
                      <input
                        type="radio"
                        name="category"
                        value="erkak"
                        checked={selectedCategory === 'erkak'}
                        onChange={() => setSelectedCategory('erkak')}
                        className="form-radio text-yellow-500"
                      />
                      <span className="ml-2">{t.men}</span>
                </label>
                    <label className="flex items-center text-gray-700">
                      <input
                        type="radio"
                        name="category"
                        value="ayol"
                        checked={selectedCategory === 'ayol'}
                        onChange={() => setSelectedCategory('ayol')}
                        className="form-radio text-yellow-500"
                      />
                      <span className="ml-2">{t.women}</span>
                    </label>
                </div>
              </div>

              {/* Price Range Filter */}
                  <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">{t.priceRange}</h3>
                  <div className="flex items-center space-x-3">
                    <input
                      type="number"
                      placeholder={t.min}
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                      className="w-1/2 border-2 border-gray-200 rounded-lg p-2 focus:border-yellow-400 focus:ring-0 text-gray-900"
                    />
                    <span>-</span>
                    <input
                      type="number"
                      placeholder={t.max}
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                      className="w-1/2 border-2 border-gray-200 rounded-lg p-2 focus:border-yellow-400 focus:ring-0 text-gray-900"
                    />
                </div>
              </div>

              {/* Brand Filter */}
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">{t.brands}</h3>
                  <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
                  {availableBrands.map((brand) => (
                      <label key={brand} className="flex items-center text-gray-700">
                      <input
                        type="checkbox"
                        checked={selectedBrands.includes(brand)}
                        onChange={() => handleBrandChange(brand)}
                          className="form-checkbox text-yellow-500"
                      />
                        <span className="ml-2">{brand}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Fragrance Notes Filter */}
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">{t.fragranceNotes}</h3>
                  <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
                  {availableFragranceNotes.map((note) => (
                      <label key={note} className="flex items-center text-gray-700">
                      <input
                        type="checkbox"
                        checked={selectedFragranceNotes.includes(note)}
                        onChange={() => handleFragranceNoteChange(note)}
                          className="form-checkbox text-yellow-500"
                      />
                        <span className="ml-2">{note}</span>
                    </label>
                  ))}
                </div>
              </div>

                {/* Action Buttons for Mobile */}
                <div className="md:hidden flex justify-between mt-8 space-x-4">
                  <button 
                    onClick={handleApplyFilters}
                    className="flex-1 bg-yellow-400 text-black px-4 py-2 rounded-xl font-semibold"
                  >
                    {t.applyFilters}
                  </button>
              <button
                    onClick={handleClearFilters}
                    className="flex-1 border border-gray-300 text-gray-700 px-4 py-2 rounded-xl font-semibold"
              >
                    {t.clearFilters}
              </button>
                </div>
              </div>
            </div>
          </div>

          {/* Products Grid */}
          <div className="md:w-3/4">
            <div className="flex justify-between items-center mb-6">
              <p className="text-black">
                {isLoading ? t.loading : `${filteredProducts.length} ${t.totalProducts.toLowerCase().replace('jami', '')} topildi`}
              </p>
            </div>

            {isLoading ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">{t.loading}</p>
              </div>
            ) : (
              <>
                {/* Horizontal Slider for Mobile */}
                <div className="md:hidden overflow-x-auto custom-scrollbar pb-4">
                  <div className="flex space-x-4">
                    {filteredProducts.map((product) => (
                      <div key={product.id} className="flex-shrink-0 w-56 bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-200">
                        <Link href={`/mahsulot/${product.id}`}>
                          <div className="cursor-pointer">
                            <div className="aspect-w-3 aspect-h-4 bg-gray-200">
                              <Image 
                                src={product.image || ''} 
                                alt={product.name}
                                width={224} // w-56, h-48
                                height={192} // w-56, h-48
                                className="w-full h-48 object-cover"
                                onError={(e) => {
                                  e.currentTarget.src = 'https://picsum.photos/300/400?random=error';
                                }}
                              />
                            </div>
                            <div className="p-3">
                              <div className="flex justify-between items-start mb-1">
                                <h3 className="text-md font-semibold text-black line-clamp-1">{product.name}</h3>
                                <span className={`px-1 py-0.5 text-xs rounded-full ${
                                  product.category === 'erkak' ? 'bg-blue-100 text-blue-800' :
                                  product.category === 'ayol' ? 'bg-pink-100 text-pink-800' :
                                  'bg-purple-100 text-purple-800'
                                }`}>
                                  {product.category === 'erkak' ? t.men : 
                                   product.category === 'ayol' ? t.women : 'Unisex'}
                                </span>
                              </div>
                              <p className="text-black mb-1 text-sm font-medium line-clamp-1">{product.brand}</p>
                            </div>
                          </div>
                        </Link>
                        <div className="px-3 pb-3">
                          <div className="text-center mb-2">
                            <span className="text-md font-bold text-black">
                              {formatPrice(product.price)}
                            </span>
                            <div className="text-xs text-gray-500">
                              {t.stock}: {product.stock} dona
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <button 
                              onClick={() => handleBuyNow()}
                              className="flex-1 bg-yellow-400 text-black px-3 py-1.5 rounded-md hover:bg-yellow-500 transition-colors duration-200 text-sm font-medium"
                            >
                              {t.buyNow}
                            </button>
                            <button 
                              onClick={() => handleAddToCart()}
                              className="flex-1 bg-gray-800 text-white px-3 py-1.5 rounded-md hover:bg-gray-700 transition-colors duration-200 text-sm font-medium"
                            >
                              {t.addToCart}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Vertical Grid for Desktop and Larger Screens */}
                <div className="hidden md:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((product) => (
                  <div key={product.id} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-200">
                    <Link href={`/mahsulot/${product.id}`}>
                      <div className="cursor-pointer">
                        <div className="aspect-w-3 aspect-h-4 bg-gray-200">
                          <Image 
                            src={product.image || ''} 
                            alt={product.name}
                            width={256} // w-64, h-64
                            height={256} // w-64, h-64
                            className="w-full h-64 object-cover"
                            onError={(e) => {
                              e.currentTarget.src = 'https://picsum.photos/300/400?random=error';
                            }}
                          />
                        </div>
                        <div className="p-4">
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="text-lg font-semibold text-black">{product.name}</h3>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              product.category === 'erkak' ? 'bg-blue-100 text-blue-800' :
                              product.category === 'ayol' ? 'bg-pink-100 text-pink-800' :
                              'bg-purple-100 text-purple-800'
                            }`}>
                                {product.category === 'erkak' ? t.men : 
                                 product.category === 'ayol' ? t.women : 'Unisex'}
                            </span>
                          </div>
                          <p className="text-black mb-2 font-medium">{product.brand}</p>
                          {product.fragrance_notes && product.fragrance_notes.length > 0 && (
                            <div className="mb-3">
                              <div className="flex flex-wrap gap-1">
                                {product.fragrance_notes.slice(0, 3).map((note, index) => (
                                  <span key={index} className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                                    {note}
                                  </span>
                                ))}
                                {product.fragrance_notes.length > 3 && (
                                  <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                                    +{product.fragrance_notes.length - 3}
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                          <div className="mb-3">
                            <p className="text-gray-600 text-sm line-clamp-2">
                              {product.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    </Link>

                    <div className="px-4 pb-4">
                      <div className="text-center mb-3">
                        <span className="text-lg font-bold text-black">
                          {formatPrice(product.price)}
                        </span>
                        <div className="text-xs text-gray-500">
                            {t.stock}: {product.stock} dona
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => handleBuyNow()}
                          className="flex-1 bg-yellow-400 text-black px-4 py-2 rounded-md hover:bg-yellow-500 transition-colors duration-200 font-medium"
                        >
                            {t.buyNow}
                        </button>
                        <button 
                          onClick={() => handleAddToCart()}
                          className="flex-1 bg-gray-800 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors duration-200 font-medium"
                        >
                            {t.addToCart}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              </>
            )}

            {!isLoading && filteredProducts.length === 0 && (
              <div className="text-center py-12">
                <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-black text-lg">{t.noProductsFound}</p>
                <p className="text-gray-400">{t.noProductsFoundDesc}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Auth Modal */}
      <AuthModal 
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleAuthSuccess}
      />

      {/* Login Modal */}
      <LoginModal 
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSuccess={() => alert('Muvaffaqiyatli kirdingiz!')}
        onSwitchToRegister={handleSwitchToRegister}
        onForgotPassword={() => {/* Parolni unutdim modal */}}
      />
    </div>
  );
} 