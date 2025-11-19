'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image'; // Import Image component
import { useRouter } from 'next/navigation';
import AuthModal from '../../components/AuthModal';
import LoginModal from '../../components/LoginModal';
import { db } from '../../lib/firebase';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { useLanguage } from '../../contexts/LanguageContext';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';

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
  const [restockModalOpen, setRestockModalOpen] = useState(false);
  const [restockProduct, setRestockProduct] = useState<Product | null>(null);
  const [restockForm, setRestockForm] = useState({ name: '', phone: '', message: '' });
  const [isRestockSubmitting, setIsRestockSubmitting] = useState(false);

  const router = useRouter();
  const { t } = useLanguage();
  const { userProfile } = useAuth();

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

useEffect(() => {
  if (!restockProduct) return;
  setRestockForm((prev) => ({
    name: userProfile?.firstName
      ? `${userProfile.firstName} ${userProfile.lastName || ''}`.trim()
      : prev.name,
    phone: userProfile?.phoneNumber || prev.phone,
    message: `${restockProduct.name} ${t.restockDefaultMessage}`
  }));
}, [restockProduct, userProfile, t]);

  // Handle buy now button click
  const handleBuyNow = (e: React.MouseEvent, productId: string) => {
    e.preventDefault();
    e.stopPropagation();
    router.push(`/mahsulot/${productId}`);
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
    if (!productItem.stock || productItem.stock <= 0) {
      toast.info(t.outOfStock);
      return;
    }
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

  const openRestockModal = (productItem: Product) => {
    setRestockProduct(productItem);
    setRestockModalOpen(true);
  };

  const closeRestockModal = () => {
    setRestockModalOpen(false);
    setRestockProduct(null);
    setRestockForm({ name: '', phone: '', message: '' });
  };

  const handleRestockInputChange = (field: 'name' | 'phone' | 'message', value: string) => {
    setRestockForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleRestockSubmit = async () => {
    if (!restockProduct) return;
    if (!restockForm.message.trim()) {
      toast.info(t.restockModalDescription);
      return;
    }

    setIsRestockSubmitting(true);
    try {
      const response = await fetch('/api/restock-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: restockProduct.id,
          productName: restockProduct.name,
          name: restockForm.name,
          phone: restockForm.phone,
          message: restockForm.message
        })
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || t.restockError);
      }

      toast.success(t.restockSuccess);
      closeRestockModal();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : t.restockError;
      toast.error(message);
    } finally {
      setIsRestockSubmitting(false);
    }
  };

  const renderProductCard = (product: Product) => {
    const isOutOfStock = !product.stock || product.stock <= 0;
    const hasLongDescription = product.description && product.description.length > 140;

    return (
      <div
        key={product.id}
        className="bg-white rounded-2xl shadow-lg overflow-hidden flex flex-col h-full hover:shadow-2xl transition-shadow duration-300"
      >
        <Link href={`/mahsulot/${product.id}`} className="block">
          <div className="bg-gray-100">
            <Image
              src={product.image || ''}
              alt={product.name}
              width={360}
              height={360}
              className="w-full h-60 object-cover"
              onError={(e) => {
                e.currentTarget.src = 'https://picsum.photos/300/400?random=error';
              }}
            />
          </div>
        </Link>

        <div className="flex-1 flex flex-col p-3 space-y-3">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="text-base font-semibold text-black line-clamp-1">{product.name}</h3>
              <p className="text-gray-700 text-sm">{product.brand}</p>
            </div>
            <span
              className={`px-2 py-1 text-xs rounded-full ${
                product.category === 'erkak'
                  ? 'bg-blue-100 text-blue-800'
                  : product.category === 'ayol'
                  ? 'bg-pink-100 text-pink-800'
                  : 'bg-purple-100 text-purple-800'
              }`}
            >
              {product.category === 'erkak' ? t.men : product.category === 'ayol' ? t.women : 'Unisex'}
            </span>
          </div>

          {product.fragrance_notes && product.fragrance_notes.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {product.fragrance_notes.slice(0, 3).map((note, index) => (
                <span
                  key={`${product.id}-note-${index}`}
                  className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full"
                >
                  {note}
                </span>
              ))}
              {product.fragrance_notes.length > 3 && (
                <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                  +{product.fragrance_notes.length - 3}
                </span>
              )}
            </div>
          )}

          <p className="text-gray-600 text-sm line-clamp-2 min-h-[36px]">{product.description}</p>
          {hasLongDescription && (
            <button
              type="button"
              onClick={() => router.push(`/mahsulot/${product.id}`)}
              className="text-xs font-semibold text-yellow-600 hover:text-yellow-700 mt-1"
            >
              {t.detailsLink}
            </button>
          )}

          <div className="mt-auto pt-2">
            <div className="text-center mb-2">
              <span className="text-base font-bold text-black">{formatPrice(product.price)}</span>
              <div className="text-xs text-gray-500 mt-0.5">
                {isOutOfStock ? t.outOfStock : `${t.stock}: ${product.stock} dona`}
              </div>
            </div>

            {isOutOfStock ? (
              <div className="flex flex-col items-center space-y-2">
                <button
                  disabled
                  className="w-full bg-gray-100 text-gray-400 px-4 py-2 rounded-md cursor-not-allowed font-semibold"
                >
                  {t.outOfStock}
                </button>
                <button
                  type="button"
                  onClick={() => openRestockModal(product)}
                  className="text-sm font-semibold text-yellow-600 hover:text-yellow-700 underline"
                >
                  {t.restockLink}
                </button>
              </div>
            ) : (
              <div className="flex space-x-2">
                <button
                  onClick={(e) => handleBuyNow(e, product.id)}
                  className="flex-1 bg-yellow-400 text-black px-3 py-2 rounded-md text-sm font-semibold hover:bg-yellow-500 transition-colors duration-200"
                >
                  {t.buyNow}
                </button>
                <button
                  onClick={() => handleAddToCart(product)}
                  className="flex-1 bg-gray-900 text-white px-3 py-2 rounded-md text-sm font-semibold hover:bg-gray-800 transition-colors duration-200"
                >
                  {t.addToCart}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
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

  if (searchTerm.trim()) {
    activeFilterTags.push({
      key: 'search',
      label: `“${searchTerm.trim()}”`,
      onRemove: () => setSearchTerm(''),
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
        <div className="flex items-center justify-between gap-3 mb-4">
          <h1 className="text-3xl font-bold text-gray-900">{t.products}</h1>
          <button 
            onClick={() => setIsFilterMenuOpen(true)}
            className="md:hidden bg-white border border-gray-200 text-gray-900 px-4 py-2 rounded-2xl font-semibold flex items-center space-x-2 shadow-sm"
          >
            <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM5 10a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H6a1 1 0 01-1-1v-2zM7 16a1 1 0 011-1h8a1 1 0 011 1v2a1 1 0 01-1 1H8a1 1 0 01-1-1v-2z" />
            </svg>
            <span>{t.filter}</span>
          </button>
        </div>

        <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between mb-6">
          <div className="relative w-full">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M10 18a8 8 0 100-16 8 8 0 000 16z" />
              </svg>
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t.searchProductsPlaceholder}
              aria-label="Product search"
              className="w-full bg-white border border-gray-200 rounded-2xl pl-11 pr-12 py-3 text-sm md:text-base text-gray-900 placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                aria-label="Clear search"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Filters Sidebar */}
          <div className={`fixed inset-0 bg-black/60 z-40 md:static md:bg-transparent
            ${isFilterMenuOpen ? 'block' : 'hidden'} md:block`}
          >
            <div 
              className={`bg-white w-80 h-full p-6 md:p-0 shadow-lg md:shadow-none
                ${isFilterMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0
                transform transition-transform duration-300 ease-in-out md:relative md:h-auto md:w-auto
                mobile-filter-scroll md:overflow-y-auto max-h-screen md:max-h-none`}
              id="mobile-filter-container"
              style={{ 
                maxHeight: '100vh', 
                overflowY: 'scroll',
                WebkitOverflowScrolling: 'touch'
              }}
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredProducts.map((product) => renderProductCard(product))}
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

      {restockModalOpen && restockProduct && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-3 py-6">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-auto">
            <div className="flex items-center justify-between px-4 py-4 sm:px-6 sm:py-6 border-b border-gray-100">
              <div>
                <p className="text-sm text-gray-500 mb-1">{t.restockModalTitle}</p>
                <h3 className="text-2xl font-bold text-gray-900">{restockProduct.name}</h3>
              </div>
              <button
                type="button"
                onClick={closeRestockModal}
                className="text-gray-400 hover:text-gray-600 rounded-full w-10 h-10 flex items-center justify-center hover:bg-gray-100 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="px-4 py-4 sm:px-6 sm:py-6 space-y-4">
              <p className="text-gray-600 text-sm">{t.restockModalDescription}</p>
              <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 text-sm">
                <p className="font-semibold text-gray-900">{restockProduct.brand}</p>
                <p className="text-gray-500">{t.stock}: {restockProduct.stock ?? 0} dona</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t.restockName}</label>
                <input
                  type="text"
                  value={restockForm.name}
                  onChange={(e) => handleRestockInputChange('name', e.target.value)}
                  className="w-full border-2 border-gray-200 rounded-xl p-3 bg-white text-gray-900 placeholder-gray-400 focus:border-yellow-400 focus:ring-0"
                  placeholder="Asil Aliyev"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t.restockPhone}</label>
                <input
                  type="text"
                  value={restockForm.phone}
                  onChange={(e) => handleRestockInputChange('phone', e.target.value)}
                  className="w-full border-2 border-gray-200 rounded-xl p-3 bg-white text-gray-900 placeholder-gray-400 focus:border-yellow-400 focus:ring-0"
                  placeholder="+998 90 000 00 00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t.restockMessageLabel}</label>
                <textarea
                  value={restockForm.message}
                  onChange={(e) => handleRestockInputChange('message', e.target.value)}
                  className="w-full border-2 border-gray-200 rounded-xl p-3 h-28 resize-none bg-white text-gray-900 placeholder-gray-400 focus:border-yellow-400 focus:ring-0"
                  placeholder={t.restockMessagePlaceholder}
                />
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={closeRestockModal}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 font-medium"
                >
                  {t.restockCancel}
                </button>
                <button
                  type="button"
                  onClick={handleRestockSubmit}
                  disabled={isRestockSubmitting}
                  className="px-4 py-2 rounded-xl bg-yellow-500 text-black font-semibold hover:bg-yellow-600 transition-colors disabled:opacity-60"
                >
                  {isRestockSubmitting ? t.loading : t.restockSend}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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