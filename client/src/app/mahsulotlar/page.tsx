'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image'; // Import Image component
import { useAuth } from '../../contexts/AuthContext';
import AuthModal from '../../components/AuthModal';
import LoginModal from '../../components/LoginModal';
import { db } from '../../lib/firebase';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { useLanguage } from '../../contexts/LanguageContext';
import { toast } from 'react-toastify';

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

interface CartStorageItem {
  id: string;
  productId: string;
  productName: string;
  productImage: string;
  size: string;
  price: number;
  quantity: number;
}

// Available brands and fragrance notes
const DEFAULT_BRANDS = [
  'Chanel', 'Dior', 'Lancôme', 'Yves Saint Laurent', 'Paco Rabanne', 
  'Carolina Herrera', 'Tom Ford', 'Versace', 'Giorgio Armani', 'Dolce & Gabbana'
];

const DEFAULT_FRAGRANCE_NOTES = [
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
  const [brandOptions, setBrandOptions] = useState<string[]>(DEFAULT_BRANDS);
  const [noteOptions, setNoteOptions] = useState<string[]>(DEFAULT_FRAGRANCE_NOTES);
  const [isFiltersLoading, setIsFiltersLoading] = useState(true);

  const { isAuthenticated } = useAuth();
  const { t } = useLanguage();

  // Firebase'dan mahsulotlarni olish
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setIsFiltersLoading(true);
      try {
        const productsSnapshot = await getDocs(collection(db, "products"));
        const productsData: Product[] = [];
        const productBrands = new Set<string>();
        const productNotes = new Set<string>();

        productsSnapshot.forEach((snapshotDoc) => {
          const data = snapshotDoc.data();
          const product: Product = {
            id: snapshotDoc.id,
            name: data.name || '',
            brand: data.brand || '',
            price: data.price || '0',
            image: data.image || 'https://picsum.photos/300/400?random=noimage',
            description: data.description || '',
            stock: data.stock || 0,
            status: data.status || 'mavjud',
            sizes: data.sizes || [{ size: '50ml', price: parseInt(data.price?.replace(/[^\d]/g, '') || '0'), image: data.image || '' }],
            category: data.category || 'erkak',
            fragrance_notes: data.fragrance_notes || []
          };

          productsData.push(product);

          if (product.brand) {
            productBrands.add(product.brand);
          }
          if (Array.isArray(product.fragrance_notes)) {
            product.fragrance_notes.filter(Boolean).forEach((note: string) => {
              productNotes.add(note);
            });
          }
        });

        setProducts(productsData);
        console.log('✅ Client: Mahsulotlar olindi:', productsData);

        try {
          const catalogDocRef = doc(db, "settings", "catalog");
          const catalogSnapshot = await getDoc(catalogDocRef);
          if (catalogSnapshot.exists()) {
            const catalogData = catalogSnapshot.data() || {};
            if (Array.isArray(catalogData.brands)) {
              catalogData.brands.filter(Boolean).forEach((brand: string) => productBrands.add(brand));
            }
            if (Array.isArray(catalogData.notes)) {
              catalogData.notes.filter(Boolean).forEach((note: string) => productNotes.add(note));
            }
          }
        } catch (catalogError) {
          console.error('⚠️ Katalog sozlamalarini olishda xatolik:', catalogError);
        }

        const mergedBrands = productBrands.size ? Array.from(productBrands) : DEFAULT_BRANDS;
        const mergedNotes = productNotes.size ? Array.from(productNotes) : DEFAULT_FRAGRANCE_NOTES;
        setBrandOptions(mergedBrands);
        setNoteOptions(mergedNotes);
      } catch (error) {
        console.error('❌ Client: Mahsulotlarni olishda xatolik:', error);
        setProducts([]);
        setBrandOptions(DEFAULT_BRANDS);
        setNoteOptions(DEFAULT_FRAGRANCE_NOTES);
      } finally {
        setIsLoading(false);
        setIsFiltersLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    setSelectedBrands((prev) => prev.filter((brand) => brandOptions.includes(brand)));
  }, [brandOptions]);

  useEffect(() => {
    setSelectedFragranceNotes((prev) => prev.filter((note) => noteOptions.includes(note)));
  }, [noteOptions]);

  // Handle buy now button click
  const handleBuyNow = () => {
    if (isAuthenticated()) {
      // User is authenticated, redirect to product page
      // window.location.href = `/mahsulot/${productId}`;
      toast.success(t.buyNowSuccess);
    } else {
      // User is not authenticated, show auth modal
      setShowAuthModal(true);
    }
  };

  // Handle add to cart button click
  const parsePriceValue = (price: string | number) => {
    if (typeof price === 'number') {
      return price;
    }
    const digits = price.replace(/[^\d]/g, '');
    return digits ? parseInt(digits) : 0;
  };

  const getStoredCart = (): CartStorageItem[] => {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem('cartItems');
    if (!stored) return [];
    try {
      const parsed = JSON.parse(stored) as CartStorageItem[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const saveCart = (items: CartStorageItem[]) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('cartItems', JSON.stringify(items));
    const totalCount = items.reduce((sum, item) => sum + (item.quantity || 0), 0);
    window.dispatchEvent(new CustomEvent('cartUpdated', { detail: { count: totalCount } }));
  };

  const handleAddToCart = (productItem: Product) => {
    if (!productItem.sizes || !productItem.sizes.length) {
      toast.info('Bu mahsulot uchun o\'lcham mavjud emas');
      return;
    }

    const selectedSize = productItem.sizes[0];
    const priceValue = parsePriceValue(selectedSize.price);
    const cartItems = getStoredCart();
    const id = `${productItem.id}-${selectedSize.size}`;
    const existingIndex = cartItems.findIndex((item) => item.id === id);

    if (existingIndex >= 0) {
      cartItems[existingIndex].quantity += 1;
    } else {
      cartItems.push({
        id,
        productId: productItem.id,
        productName: productItem.name,
        productImage: productItem.image,
        size: selectedSize.size,
        price: priceValue,
        quantity: 1
      });
    }

    saveCart(cartItems);
    toast.success(`${productItem.name} (${selectedSize.size}) savatga qo'shildi`);
  };

  // Handle successful authentication
  const handleAuthSuccess = () => {
    toast.success(t.profileUpdateSuccess);
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

  // const formatPriceInput = (value: string) => {
  //   const number = value.replace(/[^\d]/g, '');
  //   return new Intl.NumberFormat('uz-UZ').format(parseInt(number) || 0);
  // };

  // const handlePriceInputChange = (value: string, setter: (value: string) => void) => {
  //   const formattedValue = formatPriceInput(value);
  //   setter(formattedValue);
  // };

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

  const activeFilterTags = [
    ...selectedBrands.map((brand) => ({
      key: `brand-${brand}`,
      label: brand,
      onRemove: () => handleBrandChange(brand),
    })),
    ...selectedFragranceNotes.map((note) => ({
      key: `note-${note}`,
      label: note,
      onRemove: () => handleFragranceNoteChange(note),
    })),
  ];

  if (selectedCategory !== 'all') {
    activeFilterTags.push({
      key: 'category',
      label: selectedCategory === 'erkak' ? t.men : selectedCategory === 'ayol' ? t.women : 'Unisex',
      onRemove: () => setSelectedCategory('all'),
    });
  }

  if (minPrice || maxPrice) {
    activeFilterTags.push({
      key: 'price',
      label: `${minPrice || '0'} - ${maxPrice || '∞'} so'm`,
      onRemove: () => {
        setMinPrice('');
        setMaxPrice('');
      },
    });
  }

  const activeFilterCount = activeFilterTags.length;

  return (
    <div className="bg-gray-50 pb-32 md:pb-0">
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-32 md:pb-16">
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

              <div className="md:w-72 lg:w-80 space-y-6 md:block">
                <div className="bg-white/90 backdrop-blur-sm p-6 rounded-3xl shadow-xl border border-gray-200 md:sticky md:top-28 space-y-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 uppercase tracking-wide">{t.filter}</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {activeFilterCount > 0 ? `${activeFilterCount} ta filtr tanlangan` : 'Filtrlarni tanlang'}
                      </p>
                    </div>
                    {activeFilterCount > 0 && (
                      <button
                        type="button"
                        onClick={handleClearFilters}
                        className="text-sm font-semibold text-yellow-600 hover:text-yellow-700 transition-colors"
                      >
                        {t.clearFilters}
                      </button>
                    )}
                  </div>

                  {activeFilterTags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {activeFilterTags.map((tag) => (
                        <button
                          key={tag.key}
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            tag.onRemove();
                          }}
                          className="inline-flex items-center space-x-2 px-3 py-1.5 bg-gray-100 hover:bg-yellow-100 text-sm text-gray-700 rounded-full border border-gray-200 transition-colors"
                        >
                          <span>{tag.label}</span>
                          <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="space-y-6">
                    {/* Category Filter */}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                        {t.categories}
                      </h4>
                      <div className="space-y-2">
                        <label
                          className={`flex items-center justify-between px-3 py-2 rounded-xl border transition-colors ${
                            selectedCategory === 'all'
                              ? 'border-yellow-500 bg-yellow-50 text-yellow-700 shadow-sm'
                              : 'border-gray-200 hover:border-gray-300 text-gray-700'
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <input
                              type="radio"
                              name="category"
                              value="all"
                              checked={selectedCategory === 'all'}
                              onChange={() => setSelectedCategory('all')}
                              className="form-radio text-yellow-500 focus:ring-yellow-400"
                            />
                            <span className="font-medium">Barchasi</span>
                          </div>
                          {selectedCategory === 'all' && (
                            <svg className="w-4 h-4 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </label>
                        <label
                          className={`flex items-center justify-between px-3 py-2 rounded-xl border transition-colors ${
                            selectedCategory === 'erkak'
                              ? 'border-yellow-500 bg-yellow-50 text-yellow-700 shadow-sm'
                              : 'border-gray-200 hover:border-gray-300 text-gray-700'
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <input
                              type="radio"
                              name="category"
                              value="erkak"
                              checked={selectedCategory === 'erkak'}
                              onChange={() => setSelectedCategory('erkak')}
                              className="form-radio text-yellow-500 focus:ring-yellow-400"
                            />
                            <span className="font-medium">{t.men}</span>
                          </div>
                          {selectedCategory === 'erkak' && (
                            <svg className="w-4 h-4 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </label>
                        <label
                          className={`flex items-center justify-between px-3 py-2 rounded-xl border transition-colors ${
                            selectedCategory === 'ayol'
                              ? 'border-yellow-500 bg-yellow-50 text-yellow-700 shadow-sm'
                              : 'border-gray-200 hover:border-gray-300 text-gray-700'
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <input
                              type="radio"
                              name="category"
                              value="ayol"
                              checked={selectedCategory === 'ayol'}
                              onChange={() => setSelectedCategory('ayol')}
                              className="form-radio text-yellow-500 focus:ring-yellow-400"
                            />
                            <span className="font-medium">{t.women}</span>
                          </div>
                          {selectedCategory === 'ayol' && (
                            <svg className="w-4 h-4 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </label>
                      </div>
                    </div>

                    {/* Price Range Filter */}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                        {t.priceRange}
                      </h4>
                      <div className="flex items-center space-x-3">
                        <input
                          type="number"
                          placeholder={t.min}
                          value={minPrice}
                          onChange={(e) => setMinPrice(e.target.value)}
                          className="w-1/2 border-2 border-gray-200 rounded-lg p-2 focus:border-yellow-400 focus:ring-0 text-gray-900 bg-gray-50"
                        />
                        <span className="text-gray-400">-</span>
                        <input
                          type="number"
                          placeholder={t.max}
                          value={maxPrice}
                          onChange={(e) => setMaxPrice(e.target.value)}
                          className="w-1/2 border-2 border-gray-200 rounded-lg p-2 focus:border-yellow-400 focus:ring-0 text-gray-900 bg-gray-50"
                        />
                      </div>
                    </div>

                    {/* Brand Filter */}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                        {t.brands}
                      </h4>
                      <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                        {isFiltersLoading ? (
                          <div className="flex items-center justify-center py-6">
                            <div className="w-6 h-6 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin mr-2"></div>
                            <span className="text-sm text-gray-500">Yuklanmoqda...</span>
                          </div>
                        ) : (
                          brandOptions.map((brand) => {
                            const isSelected = selectedBrands.includes(brand);
                            return (
                              <label
                                key={brand}
                                className={`flex items-center justify-between px-3 py-2 rounded-xl border transition-colors text-sm ${
                                  isSelected
                                    ? 'border-yellow-500 bg-yellow-50 text-yellow-700 shadow-sm'
                                    : 'border-gray-200 hover:border-gray-300 text-gray-700'
                                }`}
                              >
                                <div className="flex items-center space-x-3">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => handleBrandChange(brand)}
                                    className="form-checkbox text-yellow-500 focus:ring-yellow-400"
                                  />
                                  <span className="font-medium">{brand}</span>
                                </div>
                                {isSelected && (
                                  <svg className="w-4 h-4 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                              </label>
                            );
                          })
                        )}
                      </div>
                    </div>

                    {/* Fragrance Notes Filter */}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                        {t.fragranceNotes}
                      </h4>
                      <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                        {isFiltersLoading ? (
                          <div className="flex items-center justify-center py-6">
                            <div className="w-6 h-6 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin mr-2"></div>
                            <span className="text-sm text-gray-500">Yuklanmoqda...</span>
                          </div>
                        ) : (
                          noteOptions.map((note) => {
                            const isSelected = selectedFragranceNotes.includes(note);
                            return (
                              <label
                                key={note}
                                className={`flex items-center justify-between px-3 py-2 rounded-xl border transition-colors text-sm ${
                                  isSelected
                                    ? 'border-yellow-500 bg-yellow-50 text-yellow-700 shadow-sm'
                                    : 'border-gray-200 hover:border-gray-300 text-gray-700'
                                }`}
                              >
                                <div className="flex items-center space-x-3">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => handleFragranceNoteChange(note)}
                                    className="form-checkbox text-yellow-500 focus:ring-yellow-400"
                                  />
                                  <span className="font-medium">{note}</span>
                                </div>
                                {isSelected && (
                                  <svg className="w-4 h-4 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                              </label>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons for Mobile */}
                <div className="md:hidden flex justify-between space-x-4">
                  <button 
                    onClick={handleApplyFilters}
                    className="flex-1 bg-yellow-400 text-black px-4 py-2 rounded-xl font-semibold shadow-md"
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
                              onClick={() => handleAddToCart(product)}
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
                          onClick={() => handleAddToCart(product)}
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