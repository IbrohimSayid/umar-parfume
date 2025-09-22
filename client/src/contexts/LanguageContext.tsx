'use client';

import React, { createContext, useState, useContext, useEffect } from 'react';

// Tillar
export type Language = 'uz' | 'ru';

// Tarjimalar interfeysi
interface Translations {
  // Umumiy
  loading: string;
  error: string;
  success: string;
  cancel: string;
  save: string;
  edit: string;
  delete: string;
  back: string;
  next: string;
  close: string;
  
  // Navbar
  home: string;
  products: string;
  about: string;
  orders: string;
  profile: string;
  login: string;
  logout: string;
  language: string;
  
  // Auth
  firstName: string;
  lastName: string;
  password: string;
  register: string;
  signIn: string;
  signUp: string;
  verification: string;
  enterCode: string;
  
  // Products
  size: string;
  price: string;
  stock: string;
  category: string;
  description: string;
  addToCart: string;
  buyNow: string;
  quantity: string;
  
  // Orders
  orderHistory: string;
  orderStatus: string;
  pending: string;
  confirmed: string;
  delivered: string;
  cancelled: string;
  orderPlaced: string;
  orderAccepted: string;
  orderRejected: string;
  
  // Messages
  orderSuccess: string;
  orderError: string;
  loginRequired: string;
  signupRequired: string;
  redirectToOrders: string;
  
  // Order page
  myOrders: string;
  noOrders: string;
  noOrdersDesc: string;
  orderDate: string;
  orderTotal: string;
  viewProduct: string;
  
  // Home page
  welcomeTitle: string;
  welcomeSubtitle: string;
  featuredProducts: string;
  viewAll: string;
  shopNow: string;

  // Features section
  whyUmarPerfume: string;
  ourAdvantages: string;
  premiumQualityTitle: string;
  premiumQualityDesc: string;
  affordablePriceTitle: string;
  affordablePriceDesc: string;
  fastDeliveryTitle: string;
  fastDeliveryDesc: string;

  // Footer
  contact: string;
  quickLinks: string;
  uzbekistanLocation: string;
  phoneNumber: string;
  instagram: string;
  telegram: string;

  // Cart page
  cart: string;
  emptyCart: string;
  emptyCartDesc: string;
  cartSummary: string;
  totalProducts: string;
  delivery: string;
  free: string;
  total: string;
  checkout: string;
  removeItem: string;

  // Products page
  allProducts: string;
  filter: string;
  categories: string;
  men: string;
  women: string;
  priceRange: string;
  min: string;
  max: string;
  brands: string;
  fragranceNotes: string;
  applyFilters: string;
  clearFilters: string;
  noProductsFound: string;
  noProductsFoundDesc: string;
  view: string;

  // Profile page
  myProfile: string;
  editProfile: string;
  profileUpdateSuccess: string;
  profileUpdateError: string;
  newPassword: string;
  confirmNewPassword: string;
  passwordMismatch: string;
  saveChanges: string;
  cancelEdit: string;
  deleteAccount: string;
  deleteAccountConfirm: string;
  deleteAccountInfo: string;
}

// Tarjimalar
const translations: Record<Language, Translations> = {
  uz: {
    // Umumiy
    loading: 'Yuklanmoqda...',
    error: 'Xatolik',
    success: 'Muvaffaqiyat',
    cancel: 'Bekor qilish',
    save: 'Saqlash',
    edit: 'Tahrirlash',
    delete: 'O\'chirish',
    back: 'Orqaga',
    next: 'Keyingi',
    close: 'Yopish',
    
    // Navbar
    home: 'Bosh sahifa',
    products: 'Mahsulotlar',
    about: 'Biz haqimizda',
    orders: 'Buyurtmalarim',
    profile: 'Profil',
    login: 'Kirish',
    logout: 'Chiqish',
    language: 'Til',
    
    // Auth
    firstName: 'Ism',
    lastName: 'Familiya',
    password: 'Parol',
    register: 'Ro\'yxatdan o\'tish',
    signIn: 'Kirish',
    signUp: 'Ro\'yxatdan o\'tish',
    verification: 'Tasdiqlash',
    enterCode: 'Kodni kiriting',
    
    // Products
    size: 'O\'lcham',
    price: 'Narx',
    stock: 'Mavjud',
    category: 'Kategoriya',
    description: 'Tavsif',
    addToCart: 'Savatga qo\'shish',
    buyNow: 'Xarid qilish',
    quantity: 'Miqdor',
    
    // Orders
    orderHistory: 'Buyurtmalar tarixi',
    orderStatus: 'Buyurtma holati',
    pending: 'Kutilmoqda',
    confirmed: 'Tasdiqlangan',
    delivered: 'Yetkazilgan',
    cancelled: 'Bekor qilingan',
    orderPlaced: 'Buyurtma berildi',
    orderAccepted: 'Qabul qilish',
    orderRejected: 'Rad etish',
    
    // Messages
    orderSuccess: 'Buyurtmangiz muvaffaqiyatli qabul qilindi!',
    orderError: 'Buyurtma berishda xatolik yuz berdi',
    loginRequired: 'Tizimga kirish kerak',
    signupRequired: 'Buyurtma berish uchun ro\'yxatdan o\'ting',
    redirectToOrders: '2 sekund ichida "Buyurtmalarim" sahifasiga yo\'naltirilasiz...',
    
    // Order page
    myOrders: 'Buyurtmalarim',
    noOrders: 'Hech qanday buyurtma yo\'q',
    noOrdersDesc: 'Siz hali hech qanday buyurtma bermagansiz',
    orderDate: 'Buyurtma sanasi',
    orderTotal: 'Jami',
    viewProduct: 'Mahsulotni ko\'rish',
    
    // Home page
    welcomeTitle: 'Eng yaxshi atirlar',
    welcomeSubtitle: 'Premium sifatli atirlar va parfyumeriya mahsulotlari',
    featuredProducts: 'Mashhur mahsulotlar',
    viewAll: 'Barchasini ko\'rish',
    shopNow: 'Xarid qilish',

    // Features section
    whyUmarPerfume: 'Nega Umar Perfum?',
    ourAdvantages: 'Bizning afzalliklarimiz',
    premiumQualityTitle: 'Premium sifat',
    premiumQualityDesc: 'Umar Perfum - bu premium sifatli parfyumeriya mahsulotlari. Bizning mahsulotlarimiz 100% tayyorlash va sifatni ta\'minlash uchun ishlab chiqariladi.',
    affordablePriceTitle: 'Arzon narx',
    affordablePriceDesc: 'Bizning mahsulotlarimizni arzon narxda olish imkoniyati. Biz sizga eng yaxshi narxni taqdim etamiz.',
    fastDeliveryTitle: 'Tez yetkazib berish',
    fastDeliveryDesc: 'Bizning mahsulotlarimizni tez yetkazib berish uchun sizning manziliga yetkazib beramiz.',

    // Footer
    contact: 'Biz bilan bog\'lanish',
    quickLinks: 'Tez kelgan havolalar',
    uzbekistanLocation: 'Toshkent, O\'zbekiston',
    phoneNumber: '+998 90 553 09 09',
    instagram: 'umar.parfume',
    telegram: 'Umar_parfumee',

    // Cart page
    cart: 'Savat',
    emptyCart: 'Savat bo\'sh',
    emptyCartDesc: 'Sizning savatingizda hozircha hech qanday mahsulot yo\'q.',
    cartSummary: 'Buyurtma xulosasi',
    totalProducts: 'Jami mahsulotlar',
    delivery: 'Yetkazib berish',
    free: 'Bepul',
    total: 'Umumiy',
    checkout: 'Buyurtmani rasmiylashtirish',
    removeItem: 'Mahsulot o\'chirildi',

    // Products page
    allProducts: 'Barcha mahsulotlar',
    filter: 'Filtrlash',
    categories: 'Kategoriyalar',
    men: 'Erkaklar',
    women: 'Ayollar',
    priceRange: 'Narx oralig\'i',
    min: 'Min',
    max: 'Max',
    brands: 'Brendlar',
    fragranceNotes: 'Parfyumeriya notalar',
    applyFilters: 'Filtrlarni qo\'llash',
    clearFilters: 'Filtrlarni tozalash',
    noProductsFound: 'Mahsulotlar topilmadi',
    noProductsFoundDesc: 'Siz talab qilgan shartlarga mos keluvchi mahsulotlar yo\'q.',
    view: 'Ko\'rish',

    // Profile page
    myProfile: 'Mening profilim',
    editProfile: 'Profilni tahrirlash',
    profileUpdateSuccess: 'Profil muvaffaqiyatli yangilandi!',
    profileUpdateError: 'Profil yangilashda xatolik yuz berdi',
    newPassword: 'Yangi parol',
    confirmNewPassword: 'Yangi parolni takrorlang',
    passwordMismatch: 'Parollar mos kelmadi',
    saveChanges: 'O\'zgarishlarni saqlash',
    cancelEdit: 'Tahrirlashni bekor qilish',
    deleteAccount: 'Hisobni o\'chirish',
    deleteAccountConfirm: 'Ha, hisobni o\'chirish',
    deleteAccountInfo: 'Hisobni o\'chirishdan oldin, e\'tibor bering: bu amalni bekor qilish mumkin emas.',
  },
  ru: {
    // Umumiy
    loading: 'Загрузка...',
    error: 'Ошибка',
    success: 'Успех',
    cancel: 'Отмена',
    save: 'Сохранить',
    edit: 'Редактировать',
    delete: 'Удалить',
    back: 'Назад',
    next: 'Далее',
    close: 'Закрыть',
    
    // Navbar
    home: 'Главная',
    products: 'Товары',
    about: 'О нас',
    orders: 'Мои заказы',
    profile: 'Профиль',
    login: 'Войти',
    logout: 'Выйти',
    language: 'Язык',
    
    // Auth
    firstName: 'Имя',
    lastName: 'Фамилия',
    password: 'Пароль',
    register: 'Регистрация',
    signIn: 'Войти',
    signUp: 'Регистрация',
    verification: 'Подтверждение',
    enterCode: 'Введите код',
    
    // Products
    size: 'Размер',
    price: 'Цена',
    stock: 'В наличии',
    category: 'Категория',
    description: 'Описание',
    addToCart: 'В корзину',
    buyNow: 'Купить сейчас',
    quantity: 'Количество',
    
    // Orders
    orderHistory: 'История заказов',
    orderStatus: 'Статус заказа',
    pending: 'В ожидании',
    confirmed: 'Подтверждён',
    delivered: 'Доставлен',
    cancelled: 'Отменён',
    orderPlaced: 'Заказ размещён',
    orderAccepted: 'Принять',
    orderRejected: 'Отклонить',
    
    // Messages
    orderSuccess: 'Ваш заказ успешно принят!',
    orderError: 'Ошибка при размещении заказа',
    loginRequired: 'Необходимо войти в систему',
    signupRequired: 'Зарегистрируйтесь для размещения заказа',
    redirectToOrders: 'Через 2 секунды будете перенаправлены на страницу "Мои заказы"...',
    
    // Order page
    myOrders: 'Мои заказы',
    noOrders: 'Заказов нет',
    noOrdersDesc: 'Вы ещё не делали заказов',
    orderDate: 'Дата заказа',
    orderTotal: 'Итого',
    viewProduct: 'Посмотреть товар',
    
    // Home page
    welcomeTitle: 'Лучшие ароматы',
    welcomeSubtitle: 'Премиальные ароматы и парфюмерные изделия',
    featuredProducts: 'Популярные товары',
    viewAll: 'Посмотреть все',
    shopNow: 'Купить сейчас',

    // Features section
    whyUmarPerfume: 'Почему Umar Perfume?',
    ourAdvantages: 'Наши преимущества',
    premiumQualityTitle: 'Премиальное качество',
    premiumQualityDesc: 'Umar Perfume - это премиальные парфюмерные изделия. Наши товары изготавливаются 100% вручную и обеспечивают качество.',
    affordablePriceTitle: 'Доступная цена',
    affordablePriceDesc: 'Вы можете купить наши товары по низкой цене. Мы предлагаем вам лучшую цену.',
    fastDeliveryTitle: 'Быстрая доставка',
    fastDeliveryDesc: 'Мы доставляем наши товары в течение 24 часов в ваш город.',

    // Footer
    contact: 'Свяжитесь с нами',
    quickLinks: 'Быстрые ссылки',
    uzbekistanLocation: 'Ташкент, Узбекистан',
    phoneNumber: '+998 90 553 09 09',
    instagram: 'umar.parfume',
    telegram: 'Umar_parfumee',

    // Cart page
    cart: 'Корзина',
    emptyCart: 'Корзина пуста',
    emptyCartDesc: 'В вашей корзине пока нет товаров.',
    cartSummary: 'Итоги заказа',
    totalProducts: 'Всего товаров',
    delivery: 'Доставка',
    free: 'Бесплатно',
    total: 'Итого',
    checkout: 'Оформить заказ',
    removeItem: 'Товар удален',

    // Products page
    allProducts: 'Все товары',
    filter: 'Фильтр',
    categories: 'Категории',
    men: 'Мужчины',
    women: 'Женщины',
    priceRange: 'Цена диапазон',
    min: 'Min',
    max: 'Max',
    brands: 'Бренды',
    fragranceNotes: 'Парфюмерные ноты',
    applyFilters: 'Применить фильтры',
    clearFilters: 'Очистить фильтры',
    noProductsFound: 'Товары не найдены',
    noProductsFoundDesc: 'Нет товаров, соответствующих вашим критериям.',
    view: 'Просмотр',

    // Profile page
    myProfile: 'Мой профиль',
    editProfile: 'Редактировать профиль',
    profileUpdateSuccess: 'Профиль успешно обновлен!',
    profileUpdateError: 'Ошибка при обновлении профиля',
    newPassword: 'Новый пароль',
    confirmNewPassword: 'Повторите новый пароль',
    passwordMismatch: 'Пароли не совпадают',
    saveChanges: 'Сохранить изменения',
    cancelEdit: 'Отменить редактирование',
    deleteAccount: 'Удалить аккаунт',
    deleteAccountConfirm: 'Да, удалить аккаунт',
    deleteAccountInfo: 'Предупреждение: это действие нельзя отменить.',
  }
};

// Context interfeysi
interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
}

// Context yaratish
const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Provider komponenti
export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
  const [language, setLanguage] = useState<Language>('uz'); // Default O'zbek

  // localStorage dan tilni yuklash
  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') as Language;
    if (savedLanguage && (savedLanguage === 'uz' || savedLanguage === 'ru')) {
      setLanguage(savedLanguage);
    }
  }, []);

  // Tilni o'zgartirish va saqlash
  const changeLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('language', lang);
  };

  const value = {
    language,
    setLanguage: changeLanguage,
    t: translations[language]
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

// Hook
export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export default LanguageContext; 