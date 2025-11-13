import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, setDoc, updateDoc, getDoc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Firebase config
const firebaseConfig = {
    apiKey: "AIzaSyAOpfGUMSd-iwoQfFRdHTTroU9PRbHsWo8",
    authDomain: "umar-parfume.firebaseapp.com",
    projectId: "umar-parfume",
    storageBucket: "umar-parfume.appspot.com",
    messagingSenderId: "11131072059",
    appId: "1:11131072059:web:3d87de297bf5a88204361e",
    measurementId: "G-L04YP5F21P"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Analytics ni o&apos;chirish (server-side rendering muammosini hal qilish uchun)
if (typeof window !== 'undefined') {
    // Faqat client-side da analytics yuklash
}

const DEFAULT_NOTES = [
    'Sitrus mevalar', 'Darx notalari', 'Gul notalari', 'Yog\'och notalari',
    'Musk', 'Vanila', 'Bergamot', 'Jasmin', 'Sandalwood', 'Patchouli',
    'Lavanda', 'Mint', 'Qora murch', 'Amber', 'Oud', 'Limon'
];

const DEFAULT_BRANDS = [
    'Chanel', 'Dior', 'Lancôme', 'Yves Saint Laurent', 'Paco Rabanne',
    'Carolina Herrera', 'Tom Ford', 'Versace', 'Giorgio Armani', 'Dolce & Gabbana'
];

const DEFAULT_SIZES = [
    '5ml', '7ml', '10ml', '15ml', '30ml', '50ml', '75ml', '100ml', 'Full'
];

const CATALOG_SETTINGS_PATH = { collection: 'settings', doc: 'catalog' };
const ADMIN_SESSION_STORAGE_KEY = 'umar_admin_session';
const ADMIN_SESSION_DURATION_DAYS = 30;

const AdminPanel = () => {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [users, setUsers] = useState([]);
    const [orders, setOrders] = useState([]);
    const [products, setProducts] = useState([]);
    const [showProductModal, setShowProductModal] = useState(false);
    const [showAdminModal, setShowAdminModal] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [dashboardLoading, setDashboardLoading] = useState(false);
    
    // Edit product state
    const [editingProduct, setEditingProduct] = useState(null);
    const [isEditMode, setIsEditMode] = useState(false);
    
    // Modal states
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => {},
        type: 'info'
    });
    const [successModal, setSuccessModal] = useState({
        isOpen: false,
        title: '',
        message: ''
    });
    
    const [loginData, setLoginData] = useState({
        firstName: '',
        lastName: '',
        phone: '',
        password: ''
    });
    
    // Yangi mahsulot qo'shish uchun state
    const [newProduct, setNewProduct] = useState({
        name: '',
        brand: '',
        price: '',
        description: '',
        category: 'erkak',
        fragranceNotes: [],
        sizes: [],
        image: '' // Asosiy mahsulot rasmi
    });
    const [productImageFile, setProductImageFile] = useState(null);
    const [productImagePreview, setProductImagePreview] = useState('');
    const [showSizesDropdown, setShowSizesDropdown] = useState(false);
    
    // Filter sozlamalari
    const [availableNotes, setAvailableNotes] = useState(DEFAULT_NOTES);
    const [availableBrands, setAvailableBrands] = useState(DEFAULT_BRANDS);
    const [availableSizes, setAvailableSizes] = useState(DEFAULT_SIZES);
    const [showBrandSettings, setShowBrandSettings] = useState(false);
    const [showNotesSettings, setShowNotesSettings] = useState(false);
    const [showSizeSettings, setShowSizeSettings] = useState(false);
    const [newNote, setNewNote] = useState('');
    const [newBrand, setNewBrand] = useState('');
    const [newSizeValue, setNewSizeValue] = useState('');
    const [editingBrand, setEditingBrand] = useState(null);
    const [editingBrandValue, setEditingBrandValue] = useState('');
    const [editingSize, setEditingSize] = useState(null);
    const [editingSizeValue, setEditingSizeValue] = useState('');
    const [showFilterSettingsModal, setShowFilterSettingsModal] = useState(false);
    const [catalogLoading, setCatalogLoading] = useState(false);
    const [catalogSaving, setCatalogSaving] = useState(false);
    
    // Admin ma'lumotlari
    const [adminInfo, setAdminInfo] = useState({
        firstName: 'Umar',
        lastName: 'Hamidhanov',
        phone: '948035747',
        password: 'umar1111',
        role: 'super_admin',
        id: 'admin_001',
        createdAt: new Date().toISOString()
    });

    // Admin management states
    const [admins, setAdmins] = useState([]);
    const [showAdminManagement, setShowAdminManagement] = useState(false);
    const [showAddAdminModal, setShowAddAdminModal] = useState(false);
    const [newAdmin, setNewAdmin] = useState({
        firstName: '',
        lastName: '',
        phone: '',
        password: '',
        role: 'admin',
        permissions: {
            canAddProducts: false,
            canEditProducts: false,
            canDeleteProducts: false,
            canAddAdmins: false,
            canEditAdmins: false,
            canDeleteAdmins: false,
            canDeleteOrders: false,
            canViewOrders: true
        }
    });
    const [editingAdmin, setEditingAdmin] = useState(null);
    const [isEditAdminMode, setIsEditAdminMode] = useState(false);

    // Orders selection and deletion states
    const [selectedOrders, setSelectedOrders] = useState([]);
    const [selectAllOrders, setSelectAllOrders] = useState(false);
    const [orderTimeFilter, setOrderTimeFilter] = useState('all'); // 'all', '1week', '1month', 'older'

    // Modal functions
    const showConfirmModal = (title, message, onConfirm, type = 'info') => {
        setConfirmModal({
            isOpen: true,
            title,
            message,
            onConfirm,
            type
        });
    };

    const showSuccessModal = (title, message) => {
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

    // Firestore'dan mahsulotlarni olish
    const fetchProducts = async () => {
        setIsLoading(true);
        try {
            const querySnapshot = await getDocs(collection(db, "products"));
            const productsData = [];
            querySnapshot.forEach((doc) => {
                productsData.push({ id: doc.id, ...doc.data() });
            });
            setProducts(productsData);
            console.log('✅ Mahsulotlar Firestore dan olindi:', productsData);
        } catch (error) {
            console.error('❌ Mahsulotlarni olishda xatolik:', error);
            alert('Mahsulotlarni yuklashda xatolik yuz berdi');
        } finally {
            setIsLoading(false);
        }
    };

    // Firestore'dan foydalanuvchilarni olish
    const fetchUsers = async () => {
        try {
            const querySnapshot = await getDocs(collection(db, "users"));
            const usersData = [];
            querySnapshot.forEach((doc) => {
                usersData.push({ id: doc.id, ...doc.data() });
            });
            setUsers(usersData);
            console.log('✅ Foydalanuvchilar Firestore dan olindi:', usersData);
        } catch (error) {
            console.error('❌ Foydalanuvchilarni olishda xatolik:', error);
        }
    };

    // Firestore'dan buyurtmalarni olish
    const fetchOrders = async () => {
        try {
            const querySnapshot = await getDocs(collection(db, "orders"));
            const ordersData = [];
            querySnapshot.forEach((doc) => {
                ordersData.push({ id: doc.id, ...doc.data() });
            });
            // Sanaga ko&apos;ra tartiblash (yangi birinchi)
            ordersData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            setOrders(ordersData);
            console.log('✅ Buyurtmalar Firestore dan olindi:', ordersData);
        } catch (error) {
            console.error('❌ Buyurtmalarni olishda xatolik:', error);
        }
    };

    const loadCatalogSettings = async () => {
        setCatalogLoading(true);
        try {
            const catalogDocRef = doc(db, CATALOG_SETTINGS_PATH.collection, CATALOG_SETTINGS_PATH.doc);
            const snapshot = await getDoc(catalogDocRef);
            if (snapshot.exists()) {
                const data = snapshot.data() || {};
                const notes = Array.isArray(data.notes) && data.notes.length ? data.notes : DEFAULT_NOTES;
                const brands = Array.isArray(data.brands) && data.brands.length ? data.brands : DEFAULT_BRANDS;
                const sizes = Array.isArray(data.sizes) && data.sizes.length ? data.sizes : DEFAULT_SIZES;
                setAvailableNotes(notes);
                setAvailableBrands(brands);
                setAvailableSizes(sizes);
            } else {
                const defaults = {
                    notes: DEFAULT_NOTES,
                    brands: DEFAULT_BRANDS,
                    sizes: DEFAULT_SIZES,
                    updatedAt: new Date().toISOString()
                };
                await setDoc(catalogDocRef, defaults);
                setAvailableNotes(DEFAULT_NOTES);
                setAvailableBrands(DEFAULT_BRANDS);
                setAvailableSizes(DEFAULT_SIZES);
            }
        } catch (error) {
            console.error('❌ Filter sozlamalarini yuklashda xatolik:', error);
            showConfirmModal(
                'Xatolik!',
                'Filter sozlamalarini yuklashda xatolik yuz berdi. Iltimos, keyinroq qayta urinib ko\'ring.',
                () => {},
                'error'
            );
        } finally {
            setCatalogLoading(false);
        }
    };

    const persistCatalogSettings = async (updates) => {
        setCatalogSaving(true);
        try {
            const catalogDocRef = doc(db, CATALOG_SETTINGS_PATH.collection, CATALOG_SETTINGS_PATH.doc);
            await setDoc(catalogDocRef, {
                ...updates,
                updatedAt: new Date().toISOString()
            }, { merge: true });
        } catch (error) {
            console.error('❌ Filter sozlamalarini saqlashda xatolik:', error);
            showConfirmModal(
                'Xatolik!',
                'Sozlamalarni saqlashda xatolik yuz berdi. Iltimos, qayta urinib ko\'ring.',
                () => {},
                'error'
            );
        } finally {
            setCatalogSaving(false);
        }
    };

    const handleAddBrand = async () => {
        const trimmed = newBrand.trim();
        if (!trimmed) {
            return;
        }
        if (availableBrands.some(brand => brand.toLowerCase() === trimmed.toLowerCase())) {
            showConfirmModal(
                'Diqqat!',
                'Bu brend ro\'yxatda allaqachon mavjud.',
                () => {},
                'warning'
            );
            return;
        }
        const updatedBrands = [...availableBrands, trimmed];
        setAvailableBrands(updatedBrands);
        setNewBrand('');
        await persistCatalogSettings({ brands: updatedBrands });
        showSuccessModal('Muvaffaqiyat!', `${trimmed} brendi qo\'shildi.`);
    };

    const handleRemoveBrand = async (brand) => {
        const isBrandUsed = products.some((product) => {
            const productBrand = (product.brand || '').toLowerCase();
            return productBrand === brand.toLowerCase();
        });

        if (isBrandUsed) {
            showConfirmModal(
                'Diqqat!',
                `${brand} brendi hozirda sotuvdagi mahsulotlarda mavjud. Avval ushbu brenddagi mahsulotlarni o\'chirib tashlang.`,
                () => {},
                'warning'
            );
            return;
        }

        const updatedBrands = availableBrands.filter(item => item !== brand);
        setAvailableBrands(updatedBrands);
        if (newProduct.brand === brand) {
            setNewProduct({ ...newProduct, brand: '' });
        }
        if (editingBrand === brand) {
            setEditingBrand(null);
            setEditingBrandValue('');
        }
        await persistCatalogSettings({ brands: updatedBrands });
        showSuccessModal('O\'chirildi', `${brand} brendi ro\'yxatdan o\'chirildi.`);
    };

    const startEditBrand = (brand) => {
        setEditingBrand(brand);
        setEditingBrandValue(brand);
    };

    const cancelBrandEdit = () => {
        setEditingBrand(null);
        setEditingBrandValue('');
    };

    const handleSaveBrandEdit = async () => {
        const trimmed = editingBrandValue.trim();
        if (!editingBrand || !trimmed) {
            return;
        }
        if (availableBrands.some(brand => brand.toLowerCase() === trimmed.toLowerCase() && brand !== editingBrand)) {
            showConfirmModal(
                'Diqqat!',
                'Kiritilgan brend nomi ro\'yxatda mavjud.',
                () => {},
                'warning'
            );
            return;
        }
        const updatedBrands = availableBrands.map(brand => brand === editingBrand ? trimmed : brand);
        setAvailableBrands(updatedBrands);
        if (newProduct.brand === editingBrand) {
            setNewProduct({ ...newProduct, brand: trimmed });
        }
        await persistCatalogSettings({ brands: updatedBrands });
        setEditingBrand(null);
        setEditingBrandValue('');
        showSuccessModal('Yangilandi', 'Brend nomi yangilandi.');
    };

    const handleAddSize = async () => {
        const trimmed = newSizeValue.trim();
        if (!trimmed) {
            return;
        }
        if (availableSizes.some(size => size.toLowerCase() === trimmed.toLowerCase())) {
            showConfirmModal(
                'Diqqat!',
                'Bu o\'lcham ro\'yxatda allaqachon mavjud.',
                () => {},
                'warning'
            );
            return;
        }
        const updatedSizes = [...availableSizes, trimmed];
        setAvailableSizes(updatedSizes);
        setNewSizeValue('');
        await persistCatalogSettings({ sizes: updatedSizes });
        showSuccessModal('Muvaffaqiyat!', `${trimmed} o'lchami qo'shildi.`);
    };

    const handleRemoveSize = async (sizeName) => {
        const updatedSizes = availableSizes.filter(item => item !== sizeName);
        setAvailableSizes(updatedSizes);
        setNewProduct(prev => ({
            ...prev,
            sizes: prev.sizes.filter(size => size.size !== sizeName)
        }));
        await persistCatalogSettings({ sizes: updatedSizes });

        try {
            setIsLoading(true);
            const productsSnapshot = await getDocs(collection(db, "products"));
            const updatePromises = [];
            const productUpdates = [];

            productsSnapshot.forEach((docSnap) => {
                const data = docSnap.data() || {};
                const productSizes = Array.isArray(data.sizes) ? data.sizes : [];
                if (productSizes.some(size => size.size === sizeName)) {
                    const filteredSizes = productSizes.filter(size => size.size !== sizeName);
                    const totalStock = filteredSizes.reduce((sum, size) => sum + (parseInt(size.stock) || 0), 0);
                    updatePromises.push(setDoc(doc(db, "products", docSnap.id), {
                        sizes: filteredSizes,
                        stock: totalStock,
                        status: totalStock > 0 ? 'mavjud' : 'mavjud emas',
                        updatedAt: new Date().toISOString()
                    }, { merge: true }));
                    productUpdates.push({
                        id: docSnap.id,
                        sizes: filteredSizes,
                        stock: totalStock,
                        status: totalStock > 0 ? 'mavjud' : 'mavjud emas'
                    });
                }
            });

            await Promise.all(updatePromises);

            if (productUpdates.length) {
                setProducts(prev => prev.map(product => {
                    const update = productUpdates.find(item => item.id === product.id);
                    return update ? { ...product, sizes: update.sizes, stock: update.stock, status: update.status } : product;
                }));
            }

            showSuccessModal('O\'chirildi', `${sizeName} o'lchami ro'yxatdan o'chirildi.`);
        } catch (error) {
            console.error('❌ O\'lchamni o\'chirishda xatolik:', error);
            showConfirmModal(
                'Xatolik!',
                'O\'lchamni o\'chirishda xatolik yuz berdi.',
                () => {},
                'error'
            );
        } finally {
            setIsLoading(false);
        }
    };

    const startEditSize = (sizeName) => {
        setEditingSize(sizeName);
        setEditingSizeValue(sizeName);
    };

    const cancelSizeEdit = () => {
        setEditingSize(null);
        setEditingSizeValue('');
    };

    const handleSaveSizeEdit = async () => {
        const trimmed = editingSizeValue.trim();
        if (!editingSize || !trimmed) {
            return;
        }
        if (availableSizes.some(size => size.toLowerCase() === trimmed.toLowerCase() && size !== editingSize)) {
            showConfirmModal(
                'Diqqat!',
                'Kiritilgan o\'lcham nomi ro\'yxatda mavjud.',
                () => {},
                'warning'
            );
            return;
        }

        const updatedSizes = availableSizes.map(size => size === editingSize ? trimmed : size);
        setAvailableSizes(updatedSizes);
        setNewProduct(prev => ({
            ...prev,
            sizes: prev.sizes.map(size => size.size === editingSize ? { ...size, size: trimmed } : size)
        }));
        await persistCatalogSettings({ sizes: updatedSizes });

        try {
            setIsLoading(true);
            const productsSnapshot = await getDocs(collection(db, "products"));
            const updatePromises = [];
            const productUpdates = [];

            productsSnapshot.forEach((docSnap) => {
                const data = docSnap.data() || {};
                const productSizes = Array.isArray(data.sizes) ? data.sizes : [];
                if (productSizes.some(size => size.size === editingSize)) {
                    const mappedSizes = productSizes.map(size => size.size === editingSize ? { ...size, size: trimmed } : size);
                    const totalStock = mappedSizes.reduce((sum, size) => sum + (parseInt(size.stock) || 0), 0);
                    updatePromises.push(setDoc(doc(db, "products", docSnap.id), {
                        sizes: mappedSizes,
                        stock: totalStock,
                        status: totalStock > 0 ? 'mavjud' : 'mavjud emas',
                        updatedAt: new Date().toISOString()
                    }, { merge: true }));
                    productUpdates.push({
                        id: docSnap.id,
                        sizes: mappedSizes,
                        stock: totalStock,
                        status: totalStock > 0 ? 'mavjud' : 'mavjud emas'
                    });
                }
            });

            await Promise.all(updatePromises);

            if (productUpdates.length) {
                setProducts(prev => prev.map(product => {
                    const update = productUpdates.find(item => item.id === product.id);
                    return update ? { ...product, sizes: update.sizes, stock: update.stock, status: update.status } : product;
                }));
            }

            showSuccessModal('Yangilandi', `${editingSize} o'lchami ${trimmed} ga o'zgartirildi.`);
        } catch (error) {
            console.error('❌ O\'lchamni yangilashda xatolik:', error);
            showConfirmModal(
                'Xatolik!',
                'O\'lchamni yangilashda xatolik yuz berdi.',
                () => {},
                'error'
            );
        } finally {
            setIsLoading(false);
            setEditingSize(null);
            setEditingSizeValue('');
        }
    };

    // Buyurtma statusini o&apos;zgartirish
    const updateOrderStatus = async (orderId, newStatus) => {
        try {
            const orderRef = doc(db, "orders", orderId);
            await updateDoc(orderRef, { status: newStatus });
            
            // Local state ni yangilash
            setOrders(prevOrders => 
                prevOrders.map(order => 
                    order.id === orderId ? { ...order, status: newStatus } : order
                )
            );
            
            showSuccessModal(
                'Status yangilandi!',
                `Buyurtma holati "${getStatusText(newStatus)}" ga o'zgartirildi.`
            );
            
            console.log('✅ Buyurtma holati yangilandi:', orderId, newStatus);
        } catch (error) {
            console.error('❌ Buyurtma holatini yangilashda xatolik:', error);
            showConfirmModal(
                'Xatolik!',
                'Buyurtma holatini yangilashda xatolik yuz berdi.',
                () => {},
                'error'
            );
        }
    };

    // Status matnini olish
    const getStatusText = (status) => {
        switch (status) {
            case 'pending': return 'Kutilmoqda';
            case 'confirmed': return 'Tasdiqlangan';
            case 'delivered': return 'Yetkazilgan';
            case 'cancelled': return 'Bekor qilingan';
            default: return status;
        }
    };

    // Status rangini olish
    const getStatusColor = (status) => {
        switch (status) {
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            case 'confirmed': return 'bg-blue-100 text-blue-800';
            case 'delivered': return 'bg-green-100 text-green-800';
            case 'cancelled': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const initializeAdminData = async () => {
        setDashboardLoading(true);
        try {
            const tasks = [
                fetchProducts(),
                fetchUsers(),
                fetchOrders(),
                loadCatalogSettings()
            ];
            if (adminInfo.role === 'super_admin') {
                tasks.push(fetchAdmins());
            }
            await Promise.all(tasks);
        } catch (error) {
            console.error('❌ Ma\'lumotlarni yuklashda xatolik:', error);
        } finally {
            setDashboardLoading(false);
        }
    };

    useEffect(() => {
        if (!isLoggedIn) {
            return;
        }
        initializeAdminData();
    }, [isLoggedIn]);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        try {
            const storedSession = localStorage.getItem(ADMIN_SESSION_STORAGE_KEY);
            if (!storedSession) return;
            const parsed = JSON.parse(storedSession);
            if (!parsed || parsed.adminId !== adminInfo.id || !parsed.expiresAt) {
                return;
            }
            const expiryDate = new Date(parsed.expiresAt);
            if (expiryDate > new Date()) {
                setIsLoggedIn(true);
            } else {
                localStorage.removeItem(ADMIN_SESSION_STORAGE_KEY);
            }
        } catch (error) {
            console.error('⚠️ Admin sessiyasini o\'qishda xatolik:', error);
            localStorage.removeItem(ADMIN_SESSION_STORAGE_KEY);
        }
    }, []);

    useEffect(() => {
        if (!isLoggedIn) {
            return;
        }

        const usersRef = collection(db, "users");
        const productsRef = collection(db, "products");
        const ordersRef = collection(db, "orders");
        const catalogDocRef = doc(db, CATALOG_SETTINGS_PATH.collection, CATALOG_SETTINGS_PATH.doc);

        const unsubscribeUsers = onSnapshot(usersRef, (snapshot) => {
            const usersData = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
            setUsers(usersData);
        });

        const unsubscribeProducts = onSnapshot(productsRef, (snapshot) => {
            const productsData = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
            setProducts(productsData);
        });

        const ordersQuery = query(ordersRef, orderBy('createdAt', 'desc'));
        const unsubscribeOrders = onSnapshot(ordersQuery, (snapshot) => {
            const ordersData = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
            setOrders(ordersData);
        });

        const unsubscribeCatalog = onSnapshot(catalogDocRef, async (docSnapshot) => {
            if (docSnapshot.exists()) {
                const data = docSnapshot.data() || {};
                if (Array.isArray(data.notes) && data.notes.length) {
                    setAvailableNotes(data.notes);
                }
                if (Array.isArray(data.brands) && data.brands.length) {
                    setAvailableBrands(data.brands);
                }
                if (Array.isArray(data.sizes) && data.sizes.length) {
                    setAvailableSizes(data.sizes);
                }
            } else {
                await setDoc(catalogDocRef, {
                    notes: DEFAULT_NOTES,
                    brands: DEFAULT_BRANDS,
                    sizes: DEFAULT_SIZES,
                    updatedAt: new Date().toISOString()
                });
            }
        });

        return () => {
            unsubscribeUsers();
            unsubscribeProducts();
            unsubscribeOrders();
            unsubscribeCatalog();
        };
    }, [isLoggedIn]);

    // Chart yaratish va yangilash
    useEffect(() => {
        if (!isLoggedIn || activeTab !== 'dashboard' || typeof window === 'undefined') {
            // Chartlarni tozalash
            if (window.usersChartInstance) {
                window.usersChartInstance.destroy();
                delete window.usersChartInstance;
            }
            if (window.ordersChartInstance) {
                window.ordersChartInstance.destroy();
                delete window.ordersChartInstance;
            }
            if (window.ordersStatusChartInstance) {
                window.ordersStatusChartInstance.destroy();
                delete window.ordersStatusChartInstance;
            }
            return;
        }

        let checkInterval = null;
        let renderTimer = null;

        const renderChartInstances = () => {
            if (!window.Chart) {
                console.error('❌ Chart.js mavjud emas');
                return;
            }

            // Users Registration Chart
            const usersCtx = document.getElementById('usersChart');
            if (usersCtx) {
                if (window.usersChartInstance) {
                    window.usersChartInstance.destroy();
                }

                const last30Days = [];
                const userCounts = [];
                for (let i = 29; i >= 0; i--) {
                    const date = new Date();
                    date.setDate(date.getDate() - i);
                    date.setHours(0, 0, 0, 0);
                    const dateStr = date.toLocaleDateString('uz-UZ', { month: 'short', day: 'numeric' });
                    last30Days.push(dateStr);
                    
                    const count = users.filter(user => {
                        if (!user.createdAt) return false;
                        const userDate = new Date(user.createdAt);
                        userDate.setHours(0, 0, 0, 0);
                        return userDate.getTime() === date.getTime();
                    }).length;
                    userCounts.push(count);
                }

                try {
                    const ctx = usersCtx.getContext('2d');
                    if (ctx) {
                        window.usersChartInstance = new window.Chart(ctx, {
                            type: 'line',
                            data: {
                                labels: last30Days,
                                datasets: [{
                                    label: 'Ro\'yxatdan o\'tganlar',
                                    data: userCounts,
                                    borderColor: 'rgb(59, 130, 246)',
                                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                                    tension: 0.4,
                                    fill: true,
                                    pointRadius: 3,
                                    pointHoverRadius: 5
                                }]
                            },
                            options: {
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: {
                                    legend: {
                                        display: true,
                                        position: 'top'
                                    }
                                },
                                scales: {
                                    y: {
                                        beginAtZero: true,
                                        ticks: {
                                            stepSize: 1
                                        }
                                    }
                                }
                            }
                        });
                        console.log('✅ Users chart yaratildi');
                    }
                } catch (error) {
                    console.error('❌ Users chart xatolik:', error);
                }
            } else {
                console.warn('⚠️ usersChart element topilmadi');
            }

            // Orders Chart
            const ordersCtx = document.getElementById('ordersChart');
            if (ordersCtx) {
                if (window.ordersChartInstance) {
                    window.ordersChartInstance.destroy();
                }

                const last30Days = [];
                const orderCounts = [];
                for (let i = 29; i >= 0; i--) {
                    const date = new Date();
                    date.setDate(date.getDate() - i);
                    date.setHours(0, 0, 0, 0);
                    const dateStr = date.toLocaleDateString('uz-UZ', { month: 'short', day: 'numeric' });
                    last30Days.push(dateStr);
                    
                    const count = orders.filter(order => {
                        if (!order.createdAt) return false;
                        const orderDate = new Date(order.createdAt);
                        orderDate.setHours(0, 0, 0, 0);
                        return orderDate.getTime() === date.getTime();
                    }).length;
                    orderCounts.push(count);
                }

                try {
                    const ctx = ordersCtx.getContext('2d');
                    if (ctx) {
                        window.ordersChartInstance = new window.Chart(ctx, {
                            type: 'bar',
                            data: {
                                labels: last30Days,
                                datasets: [{
                                    label: 'Buyurtmalar',
                                    data: orderCounts,
                                    backgroundColor: 'rgba(34, 197, 94, 0.6)',
                                    borderColor: 'rgb(34, 197, 94)',
                                    borderWidth: 1
                                }]
                            },
                            options: {
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: {
                                    legend: {
                                        display: true,
                                        position: 'top'
                                    }
                                },
                                scales: {
                                    y: {
                                        beginAtZero: true,
                                        ticks: {
                                            stepSize: 1
                                        }
                                    }
                                }
                            }
                        });
                        console.log('✅ Orders chart yaratildi');
                    }
                } catch (error) {
                    console.error('❌ Orders chart xatolik:', error);
                }
            } else {
                console.warn('⚠️ ordersChart element topilmadi');
            }

            // Orders Status Chart
            const ordersStatusCtx = document.getElementById('ordersStatusChart');
            if (ordersStatusCtx) {
                if (window.ordersStatusChartInstance) {
                    window.ordersStatusChartInstance.destroy();
                }

                const statusCounts = {
                    pending: orders.filter(o => o.status === 'pending').length,
                    confirmed: orders.filter(o => o.status === 'confirmed').length,
                    delivered: orders.filter(o => o.status === 'delivered').length,
                    cancelled: orders.filter(o => o.status === 'cancelled').length
                };

                try {
                    const ctx = ordersStatusCtx.getContext('2d');
                    if (ctx) {
                        window.ordersStatusChartInstance = new window.Chart(ctx, {
                            type: 'doughnut',
                            data: {
                                labels: ['Kutilmoqda', 'Tasdiqlandi', 'Yetkazildi', 'Bekor qilindi'],
                                datasets: [{
                                    data: [
                                        statusCounts.pending,
                                        statusCounts.confirmed,
                                        statusCounts.delivered,
                                        statusCounts.cancelled
                                    ],
                                    backgroundColor: [
                                        'rgba(234, 179, 8, 0.8)',
                                        'rgba(59, 130, 246, 0.8)',
                                        'rgba(34, 197, 94, 0.8)',
                                        'rgba(239, 68, 68, 0.8)'
                                    ],
                                    borderColor: [
                                        'rgb(234, 179, 8)',
                                        'rgb(59, 130, 246)',
                                        'rgb(34, 197, 94)',
                                        'rgb(239, 68, 68)'
                                    ],
                                    borderWidth: 2
                                }]
                            },
                            options: {
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: {
                                    legend: {
                                        display: true,
                                        position: 'right'
                                    }
                                }
                            }
                        });
                        console.log('✅ Orders status chart yaratildi');
                    }
                } catch (error) {
                    console.error('❌ Orders status chart xatolik:', error);
                }
            } else {
                console.warn('⚠️ ordersStatusChart element topilmadi');
            }
        };

        // Chart.js yuklanishini kutish va chartlarni render qilish
        const renderCharts = () => {
            // DOM tayyor bo'lishini kutish
            renderTimer = setTimeout(() => {
                if (!window.Chart) {
                    console.warn('⚠️ Chart.js hali yuklanmagan, qayta urinib ko\'rilmoqda...');
                    // Chart.js yuklanishini kutish
                    let attempts = 0;
                    const maxAttempts = 20;
                    const checkChart = setInterval(() => {
                        attempts++;
                        if (window.Chart) {
                            clearInterval(checkChart);
                            renderChartInstances();
                        } else if (attempts >= maxAttempts) {
                            clearInterval(checkChart);
                            console.error('❌ Chart.js yuklanmadi');
                        }
                    }, 200);
                    return;
                }

                renderChartInstances();
            }, 800);
        };

        // Chart.js yuklanishini kutish
        if (window.Chart) {
            renderCharts();
        } else {
            let attempts = 0;
            const maxAttempts = 50; // 5 sekund (50 * 100ms)
            checkInterval = setInterval(() => {
                attempts++;
                if (window.Chart) {
                    clearInterval(checkInterval);
                    renderCharts();
                } else if (attempts >= maxAttempts) {
                    clearInterval(checkInterval);
                    console.error('❌ Chart.js yuklanmadi');
                }
            }, 100);
        }

        return () => {
            if (checkInterval) {
                clearInterval(checkInterval);
            }
            if (renderTimer) {
                clearTimeout(renderTimer);
            }
            if (window.usersChartInstance) {
                window.usersChartInstance.destroy();
                delete window.usersChartInstance;
            }
            if (window.ordersChartInstance) {
                window.ordersChartInstance.destroy();
                delete window.ordersChartInstance;
            }
            if (window.ordersStatusChartInstance) {
                window.ordersStatusChartInstance.destroy();
                delete window.ordersStatusChartInstance;
            }
        };
    }, [isLoggedIn, activeTab, users, orders]);

    const handleLogin = (e) => {
        e.preventDefault();
        const { firstName, lastName, phone, password } = loginData;
        
        // Debug uchun
        console.log('Kiritilgan ma\'lumotlar:', { firstName, lastName, phone, password });
        console.log('Kutilgan ma\'lumotlar:', adminInfo);
        
        if (firstName === adminInfo.firstName && 
            lastName === adminInfo.lastName && 
            phone === adminInfo.phone && 
            password === adminInfo.password) {
            setIsLoggedIn(true);
            if (typeof window !== 'undefined') {
                const expiresAt = new Date();
                expiresAt.setDate(expiresAt.getDate() + ADMIN_SESSION_DURATION_DAYS);
                const sessionPayload = {
                    token: `admin_${adminInfo.id}_${Date.now()}`,
                    adminId: adminInfo.id,
                    expiresAt: expiresAt.toISOString()
                };
                localStorage.setItem(ADMIN_SESSION_STORAGE_KEY, JSON.stringify(sessionPayload));
            }
            showSuccessModal('Muvaffaqiyat!', 'Admin panelga muvaffaqiyatli kirdingiz!');
            setActiveTab('dashboard'); // Dashboard'ni default qilish
            setLoginData({
                firstName: '',
                lastName: '',
                phone: '',
                password: ''
            });
        } else {
            showConfirmModal(
                'Xatolik!', 
                'Kiritilgan ma\'lumotlar noto\'g\'ri. Iltimos, qayta urinib ko\'ring.',
                () => {},
                'error'
            );
        }
    };

    const logoutAdmin = () => {
        setIsLoggedIn(false);
        setActiveTab('dashboard');
        setDashboardLoading(false);
        setIsLoading(false);
        setCatalogLoading(false);
        setCatalogSaving(false);
        if (typeof window !== 'undefined') {
            localStorage.removeItem(ADMIN_SESSION_STORAGE_KEY);
            // Chart instancelarini tozalash
            if (window.usersChartInstance) {
                window.usersChartInstance.destroy();
                delete window.usersChartInstance;
            }
            if (window.ordersChartInstance) {
                window.ordersChartInstance.destroy();
                delete window.ordersChartInstance;
            }
            if (window.ordersStatusChartInstance) {
                window.ordersStatusChartInstance.destroy();
                delete window.ordersStatusChartInstance;
            }
        }
    };

    const shouldShowGlobalLoader = dashboardLoading || isLoading || catalogSaving || catalogLoading;

    const handleAdminUpdate = (e) => {
        e.preventDefault();
        setShowAdminModal(false);
        showSuccessModal('Muvaffaqiyat!', 'Admin ma\'lumotlari muvaffaqiyatli yangilandi!');
    };

    // O'lcham qo'shish funksiyasi
    const addProductSize = () => {
        const newSize = {
            size: '',
            price: '',
            stock: '',
            imageName: '' // O'lcham uchun rasm
        };
        setNewProduct({
            ...newProduct,
            sizes: [...newProduct.sizes, newSize]
        });
    };

    // O'lchamni yangilash
    const updateProductSize = (index, field, value) => {
        const updatedSizes = newProduct.sizes.map((size, idx) =>
            idx === index ? { ...size, [field]: value } : size
        );
        setNewProduct({ ...newProduct, sizes: updatedSizes });
    };

    // O'lchamni o'chirish
    const removeProductSize = (index) => {
        const updatedSizes = newProduct.sizes.filter((_, idx) => idx !== index);
        setNewProduct({ ...newProduct, sizes: updatedSizes });
    };

    // Asosiy mahsulot rasmini yuklash
    const handleProductImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setProductImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setProductImagePreview(reader.result);
                setNewProduct({ ...newProduct, image: reader.result });
            };
            reader.readAsDataURL(file);
        }
    };

    // O'lcham rasmini yuklash
    const handleSizeImageChange = (index, e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                updateProductSize(index, 'imageName', reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    // Nota qo'shish/o'chirish
    const addNote = async () => {
        const trimmed = newNote.trim();
        if (!trimmed) {
            return;
        }
        if (availableNotes.some(note => note.toLowerCase() === trimmed.toLowerCase())) {
            showConfirmModal(
                'Diqqat!',
                'Bu nota ro\'yxatda allaqachon mavjud.',
                () => {},
                'warning'
            );
            return;
        }
        const updatedNotes = [...availableNotes, trimmed];
        setAvailableNotes(updatedNotes);
        setNewNote('');
        await persistCatalogSettings({ notes: updatedNotes });
        showSuccessModal('Muvaffaqiyat!', `${trimmed} notasi qo\'shildi.`);
    };

    const removeNote = async (note) => {
        const isNoteUsed = products.some((product) => {
            const productNotes = product.fragrance_notes || product.fragranceNotes || [];
            return Array.isArray(productNotes) && productNotes.some((item) => item === note);
        });

        if (isNoteUsed) {
            showConfirmModal(
                'Diqqat!',
                `${note} notasi hozirda sotuvdagi mahsulotlarda mavjud. Avval ushbu notadan foydalanayotgan mahsulotlarni o\'chirib tashlang.`,
                () => {},
                'warning'
            );
            return;
        }

        const updatedNotes = availableNotes.filter(n => n !== note);
        setAvailableNotes(updatedNotes);
        setNewProduct({
            ...newProduct,
            fragranceNotes: newProduct.fragranceNotes.filter(n => n !== note)
        });
        await persistCatalogSettings({ notes: updatedNotes });
        showSuccessModal('O\'chirildi', `${note} notasi ro\'yxatdan o\'chirildi.`);
    };

    const toggleNote = (note) => {
        const isSelected = newProduct.fragranceNotes.includes(note);
        if (isSelected) {
            setNewProduct({
                ...newProduct,
                fragranceNotes: newProduct.fragranceNotes.filter(n => n !== note)
            });
        } else {
            setNewProduct({
                ...newProduct,
                fragranceNotes: [...newProduct.fragranceNotes, note]
            });
        }
    };

    // Yangi mahsulotni Firestore'ga saqlash
    const handleProductSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        
        try {
            const cleanedSizes = newProduct.sizes
                .filter(size => size.size)
                .map(size => ({
                    size: size.size,
                    price: size.price || '0',
                    stock: size.stock || '0'
                }));

            if (!cleanedSizes.length) {
                showConfirmModal(
                    'Diqqat!',
                    'Kamida bitta o\'lcham tanlang.',
                    () => {},
                    'warning'
                );
                setIsLoading(false);
                return;
            }

            const totalStock = cleanedSizes.reduce((sum, size) => {
                return sum + (parseInt(size.stock) || 0);
            }, 0);

            const product = {
                name: newProduct.name,
                brand: newProduct.brand,
                price: newProduct.price,
                stock: totalStock,
                status: totalStock > 0 ? 'mavjud' : 'mavjud emas',
                image: newProduct.image || `https://images.unsplash.com/photo-1541643600914-78b084683601?w=300&h=400&fit=crop&random=${Date.now()}`,
                description: newProduct.description,
                category: newProduct.category,
                fragrance_notes: newProduct.fragranceNotes,
                sizes: cleanedSizes,
                createdAt: new Date().toISOString()
            };
            
            const docRef = await addDoc(collection(db, "products"), product);
            console.log('✅ Mahsulot Firestore ga saqlandi, ID:', docRef.id);
            
            await logAdminAction(
                'CREATE_PRODUCT',
                `Yangi mahsulot qo'shildi: ${product.name} (${product.brand})`,
                'product',
                docRef.id
            );
            
            setProducts([...products, { id: docRef.id, ...product }]);
            
            setNewProduct({
                name: '',
                brand: '',
                price: '',
                description: '',
                category: 'erkak',
                fragranceNotes: [],
                sizes: [],
                image: ''
            });
            setProductImageFile(null);
            setProductImagePreview('');
            setShowSizesDropdown(false);
            setShowProductModal(false);
            showSuccessModal('Muvaffaqiyat!', 'Mahsulot muvaffaqiyatli qo\'shildi!');
        } catch (error) {
            console.error('❌ Mahsulotni saqlashda xatolik:', error);
            showConfirmModal(
                'Xatolik!',
                'Mahsulotni saqlashda xatolik yuz berdi: ' + error.message,
                () => {},
                'error'
            );
        } finally {
            setIsLoading(false);
        }
    };

    // Mahsulotni Firestore'dan o'chirish
    const deleteProduct = async (id) => {
        showConfirmModal(
            'Mahsulotni o\'chirish',
            'Bu mahsulotni o\'chirmoqchimisiz? Bu amal qaytarib bo\'lmaydi!',
            async () => {
                setIsLoading(true);
                try {
                    // Mahsulot ma'lumotlarini olish (log uchun)
                    const productToDelete = products.find(p => p.id === id);
                    
                    await deleteDoc(doc(db, "products", id));
                    setProducts(products.filter(p => p.id !== id));
                    
                    // Admin amalini log qilish
                    await logAdminAction(
                        'DELETE_PRODUCT',
                        `Mahsulot o'chirildi: ${productToDelete?.name || 'Noma\'lum'} (${productToDelete?.brand || 'Noma\'lum'})`,
                        'product',
                        id
                    );
                    
                    console.log('✅ Mahsulot o\'chirildi');
                    showSuccessModal('Muvaffaqiyat!', 'Mahsulot muvaffaqiyatli o\'chirildi');
                } catch (error) {
                    console.error('❌ Mahsulotni o\'chirishda xatolik:', error);
                    showConfirmModal(
                        'Xatolik!',
                        'Mahsulotni o\'chirishda xatolik yuz berdi',
                        () => {},
                        'error'
                    );
                } finally {
                    setIsLoading(false);
                }
            },
            'warning'
        );
    };

    // Mahsulotni tahrirlash uchun modal ochish
    const openEditModal = (product) => {
        setEditingProduct(product);
        setIsEditMode(true);
        
        // newProduct state'ini tahrirlash uchun to'ldirish
        setNewProduct({
            name: product.name || '',
            brand: product.brand || '',
            price: product.price || '',
            description: product.description || '',
            category: product.category || 'erkak',
            fragranceNotes: product.fragrance_notes || [],
            sizes: product.sizes || []
        });

        const productSizeNames = (product.sizes || [])
            .map(size => size.size)
            .filter(size => size && typeof size === 'string');
        if (productSizeNames.length) {
            setAvailableSizes(prev => {
                const merged = new Set(prev);
                productSizeNames.forEach(size => merged.add(size));
                return Array.from(merged);
            });
        }
        
        setShowProductModal(true);
    };

    // Mahsulotni yangilash
    const handleProductUpdate = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        
        try {
            const cleanedSizes = newProduct.sizes
                .filter(size => size.size)
                .map(size => ({
                    size: size.size,
                    price: size.price || '0',
                    stock: size.stock || '0'
                }));

            if (!cleanedSizes.length) {
                showConfirmModal(
                    'Diqqat!',
                    'Kamida bitta o\'lcham tanlang.',
                    () => {},
                    'warning'
                );
                setIsLoading(false);
                return;
            }

            const totalStock = cleanedSizes.reduce((sum, size) => {
                return sum + (parseInt(size.stock) || 0);
            }, 0);

            const updatedProduct = {
                name: newProduct.name,
                brand: newProduct.brand,
                price: newProduct.price,
                stock: totalStock, // O'lchamlar sonidan hisoblangan
                status: totalStock > 0 ? 'mavjud' : 'mavjud emas',
                image: newProduct.image || editingProduct.image, // Yangi rasm yoki eski rasmni saqlash
                description: newProduct.description,
                category: newProduct.category,
                fragrance_notes: newProduct.fragranceNotes,
                sizes: cleanedSizes,
                updatedAt: new Date().toISOString()
            };
            
            // Firestore'da yangilash
            const productRef = doc(db, "products", editingProduct.id);
            await setDoc(productRef, updatedProduct, { merge: true });
            
            // Admin amalini log qilish
            await logAdminAction(
                'UPDATE_PRODUCT',
                `Mahsulot yangilandi: ${updatedProduct.name} (${updatedProduct.brand})`,
                'product',
                editingProduct.id
            );
            
            // Local state ni yangilash
            setProducts(products.map(p => 
                p.id === editingProduct.id ? { id: editingProduct.id, ...updatedProduct } : p
            ));
            
            closeProductModal();
            showSuccessModal('Muvaffaqiyat!', 'Mahsulot muvaffaqiyatli yangilandi!');
            console.log('✅ Mahsulot yangilandi:', updatedProduct);
        } catch (error) {
            console.error('❌ Mahsulotni yangilashda xatolik:', error);
            showConfirmModal(
                'Xatolik!',
                'Mahsulotni yangilashda xatolik yuz berdi: ' + error.message,
                () => {},
                'error'
            );
        } finally {
            setIsLoading(false);
        }
    };

    // Modal yopilganda tozalash
    const closeProductModal = () => {
        setShowProductModal(false);
        setIsEditMode(false);
        setEditingProduct(null);
        setNewProduct({
            name: '',
            brand: '',
            price: '',
            description: '',
            category: 'erkak',
            fragranceNotes: [],
            sizes: [],
            image: ''
        });
        setProductImageFile(null);
        setProductImagePreview('');
        setShowSizesDropdown(false);
    };

    // Foydalanuvchini o'chirish
    const deleteUser = async (userId) => {
        showConfirmModal(
            'Foydalanuvchini o\'chirish',
            'Bu foydalanuvchini o\'chirmoqchimisiz? Bu amal qaytarib bo\'lmaydi!',
            async () => {
                setIsLoading(true);
                try {
                    // User ma'lumotlarini olish (log uchun)
                    const userToDelete = users.find(u => u.id === userId);
                    
                    await deleteDoc(doc(db, "users", userId));
                    setUsers(users.filter(u => u.id !== userId));
                    
                    // Admin amalini log qilish
                    await logAdminAction(
                        'DELETE_USER',
                        `Foydalanuvchi o'chirildi: ${userToDelete?.firstName || 'Noma\'lum'} ${userToDelete?.lastName || ''} (${userToDelete?.phoneNumber || 'Noma\'lum'})`,
                        'user',
                        userId
                    );
                    
                    console.log('✅ Foydalanuvchi o\'chirildi');
                    showSuccessModal('Muvaffaqiyat!', 'Foydalanuvchi muvaffaqiyatli o\'chirildi');
                } catch (error) {
                    console.error('❌ Foydalanuvchini o\'chirishda xatolik:', error);
                    showConfirmModal(
                        'Xatolik!',
                        'Foydalanuvchini o\'chirishda xatolik yuz berdi',
                        () => {},
                        'error'
                    );
                } finally {
                    setIsLoading(false);
                }
            },
            'error'
        );
    };

    // Foydalanuvchini bloklash/blokdan chiqarish
    const toggleUserBlock = async (userId, currentStatus) => {
        const newStatus = currentStatus === 'blocked' ? 'active' : 'blocked';
        const action = newStatus === 'blocked' ? 'bloklash' : 'faollashtirish';
        
        showConfirmModal(
            `Foydalanuvchini ${action}`,
            `Bu foydalanuvchini ${action}moqchimisiz?`,
            async () => {
                setIsLoading(true);
                try {
                    // Foydalanuvchi holatini yangilash
                    const userRef = doc(db, "users", userId);
                    await setDoc(userRef, { status: newStatus }, { merge: true });
                    
                    // Local state ni yangilash
                    // User ma'lumotlarini olish (log uchun)
                    const userToUpdate = users.find(u => u.id === userId);
                    
                    setUsers(users.map(user => 
                        user.id === userId ? { ...user, status: newStatus } : user
                    ));
                    
                    // Admin amalini log qilish
                    await logAdminAction(
                        newStatus === 'blocked' ? 'BLOCK_USER' : 'UNBLOCK_USER',
                        `Foydalanuvchi ${action}ildi: ${userToUpdate?.firstName || 'Noma\'lum'} ${userToUpdate?.lastName || ''} (${userToUpdate?.phoneNumber || 'Noma\'lum'})`,
                        'user',
                        userId
                    );
                    
                    console.log(`✅ Foydalanuvchi ${action}ildi`);
                    showSuccessModal('Muvaffaqiyat!', `Foydalanuvchi muvaffaqiyatli ${action}ildi`);
                } catch (error) {
                    console.error(`❌ Foydalanuvchini ${action}ishda xatolik:`, error);
                    showConfirmModal(
                        'Xatolik!',
                        `Foydalanuvchini ${action}ishda xatolik yuz berdi`,
                        () => {},
                        'error'
                    );
                } finally {
                    setIsLoading(false);
                }
            },
            'warning'
        );
    };

    // Admin amallarini log qilish funksiyasi
    const logAdminAction = async (action, details, targetType, targetId = null) => {
        try {
            const logData = {
                adminId: adminInfo.id,
                adminName: `${adminInfo.firstName} ${adminInfo.lastName}`,
                action: action,
                details: details,
                targetType: targetType, // 'product', 'user', 'admin', 'order'
                targetId: targetId,
                timestamp: new Date().toISOString(),
                ip: 'N/A', // Keyinroq IP ni olish mumkin
                userAgent: navigator.userAgent || 'N/A'
            };
            
            await addDoc(collection(db, "admin_logs"), logData);
            console.log('✅ Admin amali log qilindi:', logData);
        } catch (error) {
            console.error('❌ Admin amalini log qilishda xatolik:', error);
        }
    };

    // Admin management functions
    const fetchAdmins = async () => {
        try {
            const querySnapshot = await getDocs(collection(db, "admins"));
            const adminsData = [];
            querySnapshot.forEach((doc) => {
                adminsData.push({ id: doc.id, ...doc.data() });
            });
            setAdmins(adminsData);
            console.log('✅ Adminlar Firestore dan olindi:', adminsData);
        } catch (error) {
            console.error('❌ Adminlarni olishda xatolik:', error);
        }
    };

    const closeAddAdminModal = () => {
        setShowAddAdminModal(false);
        setIsEditAdminMode(false);
        setEditingAdmin(null);
        setNewAdmin({
            firstName: '',
            lastName: '',
            phone: '',
            password: '',
            role: 'admin',
            permissions: {
                canAddProducts: false,
                canEditProducts: false,
                canDeleteProducts: false,
                canAddAdmins: false,
                canEditAdmins: false,
                canDeleteAdmins: false,
                canDeleteOrders: false,
                canViewOrders: true
            }
        });
    };

    const addAdmin = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        
        try {
            const adminData = {
                ...newAdmin,
                id: `admin_${Date.now()}`,
                status: 'active',
                createdAt: new Date().toISOString(),
                createdBy: adminInfo.id
            };
            
            const docRef = await addDoc(collection(db, "admins"), adminData);
            setAdmins([...admins, { id: docRef.id, ...adminData }]);
            
            // Admin amalini log qilish
            await logAdminAction(
                'CREATE_ADMIN',
                `Yangi admin qo'shildi: ${adminData.firstName} ${adminData.lastName} (${adminData.phone})`,
                'admin',
                docRef.id
            );
            
            closeAddAdminModal();
            showSuccessModal('Muvaffaqiyat!', 'Yangi admin muvaffaqiyatli qo\'shildi!');
        } catch (error) {
            console.error('❌ Admin qo\'shishda xatolik:', error);
            showConfirmModal(
                'Xatolik!',
                'Admin qo\'shishda xatolik yuz berdi: ' + error.message,
                () => {},
                'error'
            );
        } finally {
            setIsLoading(false);
        }
    };

    const openEditAdminModal = (admin) => {
        setEditingAdmin(admin);
        setIsEditAdminMode(true);
        setNewAdmin({
            firstName: admin.firstName || '',
            lastName: admin.lastName || '',
            phone: admin.phone || '',
            password: '', // Parolni bo'sh qoldirish
            role: admin.role || 'admin',
            permissions: admin.permissions || {
                canAddProducts: false,
                canEditProducts: false,
                canDeleteProducts: false,
                canAddAdmins: false,
                canEditAdmins: false,
                canDeleteAdmins: false,
                canDeleteOrders: false,
                canViewOrders: true
            }
        });
        setShowAddAdminModal(true);
    };

    const updateAdmin = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        
        try {
            const updatedData = {
                firstName: newAdmin.firstName,
                lastName: newAdmin.lastName,
                phone: newAdmin.phone,
                role: newAdmin.role,
                permissions: newAdmin.permissions,
                updatedAt: new Date().toISOString(),
                updatedBy: adminInfo.id
            };
            
            // Agar parol kiritilgan bo'lsa, uni ham yangilash
            if (newAdmin.password.trim()) {
                updatedData.password = newAdmin.password;
            }
            
            const adminRef = doc(db, "admins", editingAdmin.id);
            await setDoc(adminRef, updatedData, { merge: true });
            
            // Admin amalini log qilish
            await logAdminAction(
                'UPDATE_ADMIN',
                `Admin yangilandi: ${updatedData.firstName} ${updatedData.lastName} (${updatedData.phone})`,
                'admin',
                editingAdmin.id
            );
            
            setAdmins(admins.map(admin => 
                admin.id === editingAdmin.id ? { ...admin, ...updatedData } : admin
            ));
            
            closeAddAdminModal();
            showSuccessModal('Muvaffaqiyat!', 'Admin ma\'lumotlari muvaffaqiyatli yangilandi!');
        } catch (error) {
            console.error('❌ Adminni yangilashda xatolik:', error);
            showConfirmModal(
                'Xatolik!',
                'Adminni yangilashda xatolik yuz berdi: ' + error.message,
                () => {},
                'error'
            );
        } finally {
            setIsLoading(false);
        }
    };

    const toggleAdminBlock = async (adminId, currentStatus) => {
        const newStatus = currentStatus === 'blocked' ? 'active' : 'blocked';
        const action = newStatus === 'blocked' ? 'bloklash' : 'faollashtirish';
        
        showConfirmModal(
            `Adminni ${action}`,
            `Bu adminni ${action}moqchimisiz?`,
            async () => {
                setIsLoading(true);
                try {
                    // Admin ma'lumotlarini olish (log uchun)
                    const adminToUpdate = admins.find(a => a.id === adminId);
                    
                    const adminRef = doc(db, "admins", adminId);
                    await setDoc(adminRef, { 
                        status: newStatus,
                        updatedAt: new Date().toISOString(),
                        updatedBy: adminInfo.id
                    }, { merge: true });
                    
                    // Admin amalini log qilish
                    await logAdminAction(
                        newStatus === 'blocked' ? 'BLOCK_ADMIN' : 'UNBLOCK_ADMIN',
                        `Admin ${action}ildi: ${adminToUpdate?.firstName || 'Noma\'lum'} ${adminToUpdate?.lastName || ''} (${adminToUpdate?.phone || 'Noma\'lum'})`,
                        'admin',
                        adminId
                    );
                    
                    setAdmins(admins.map(admin => 
                        admin.id === adminId ? { ...admin, status: newStatus } : admin
                    ));
                    
                    showSuccessModal('Muvaffaqiyat!', `Admin muvaffaqiyatli ${action}ildi`);
                } catch (error) {
                    console.error(`❌ Adminni ${action}ishda xatolik:`, error);
                    showConfirmModal(
                        'Xatolik!',
                        `Adminni ${action}ishda xatolik yuz berdi`,
                        () => {},
                        'error'
                    );
                } finally {
                    setIsLoading(false);
                }
            },
            'warning'
        );
    };

    const deleteAdmin = async (adminId) => {
        showConfirmModal(
            'Adminni o\'chirish',
            'Bu adminni o\'chirmoqchimisiz? Bu amal qaytarib bo\'lmaydi!',
            async () => {
                setIsLoading(true);
                try {
                    // Admin ma'lumotlarini olish (log uchun)
                    const adminToDelete = admins.find(a => a.id === adminId);
                    
                    await deleteDoc(doc(db, "admins", adminId));
                    setAdmins(admins.filter(admin => admin.id !== adminId));
                    
                    // Admin amalini log qilish
                    await logAdminAction(
                        'DELETE_ADMIN',
                        `Admin o'chirildi: ${adminToDelete?.firstName || 'Noma\'lum'} ${adminToDelete?.lastName || ''} (${adminToDelete?.phone || 'Noma\'lum'})`,
                        'admin',
                        adminId
                    );
                    
                    showSuccessModal('Muvaffaqiyat!', 'Admin muvaffaqiyatli o\'chirildi');
                } catch (error) {
                    console.error('❌ Adminni o\'chirishda xatolik:', error);
                    showConfirmModal(
                        'Xatolik!',
                        'Adminni o\'chirishda xatolik yuz berdi',
                        () => {},
                        'error'
                    );
                } finally {
                    setIsLoading(false);
                }
            },
            'error'
        );
    };

    // Orders selection and deletion functions
    const handleOrderSelect = (orderId) => {
        setSelectedOrders(prev => 
            prev.includes(orderId) 
                ? prev.filter(id => id !== orderId)
                : [...prev, orderId]
        );
    };

    const handleSelectAllOrders = () => {
        if (selectAllOrders) {
            setSelectedOrders([]);
            setSelectAllOrders(false);
        } else {
            const filteredOrders = getFilteredOrders();
            setSelectedOrders(filteredOrders.map(order => order.id));
            setSelectAllOrders(true);
        }
    };

    const getFilteredOrders = () => {
        const now = new Date();
        let filtered = [...orders];

        if (orderTimeFilter === '1week') {
            const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            filtered = filtered.filter(order => {
                const orderDate = new Date(order.createdAt || order.timestamp || order.date);
                return orderDate >= oneWeekAgo;
            });
        } else if (orderTimeFilter === '1month') {
            const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            filtered = filtered.filter(order => {
                const orderDate = new Date(order.createdAt || order.timestamp || order.date);
                return orderDate >= oneMonthAgo;
            });
        } else if (orderTimeFilter === 'older') {
            const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            filtered = filtered.filter(order => {
                const orderDate = new Date(order.createdAt || order.timestamp || order.date);
                return orderDate < oneMonthAgo;
            });
        }

        return filtered;
    };

    const deleteSelectedOrders = async () => {
        if (selectedOrders.length === 0) {
            showConfirmModal('Diqqat!', 'O\'chirish uchun hech bo\'lmaganda bitta buyurtmani tanlang', () => {}, 'warning');
            return;
        }

        showConfirmModal(
            'Buyurtmalarni o\'chirish',
            `${selectedOrders.length} ta buyurtmani o\'chirmoqchimisiz? Bu amal qaytarib bo\'lmaydi!`,
            async () => {
                setIsLoading(true);
                try {
                    const deletePromises = selectedOrders.map(orderId => 
                        deleteDoc(doc(db, "orders", orderId))
                    );
                    await Promise.all(deletePromises);
                    
                    setOrders(orders.filter(order => !selectedOrders.includes(order.id)));
                    setSelectedOrders([]);
                    setSelectAllOrders(false);
                    
                    await logAdminAction(
                        'DELETE_ORDERS',
                        `${selectedOrders.length} ta buyurtma o'chirildi`,
                        'order',
                        null
                    );
                    
                    showSuccessModal('Muvaffaqiyat!', `${selectedOrders.length} ta buyurtma muvaffaqiyatli o'chirildi`);
                } catch (error) {
                    console.error('❌ Buyurtmalarni o\'chirishda xatolik:', error);
                    showConfirmModal(
                        'Xatolik!',
                        'Buyurtmalarni o\'chirishda xatolik yuz berdi',
                        () => {},
                        'error'
                    );
                } finally {
                    setIsLoading(false);
                }
            },
            'error'
        );
    };

    // Login sahifasi
    if (!isLoggedIn) {
        return (
            <div 
                className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 flex items-center justify-center p-4"
                style={{ 
                    backgroundImage: 'radial-gradient(circle at 25% 25%, rgba(255, 215, 0, 0.1) 0%, transparent 50%), radial-gradient(circle at 75% 75%, rgba(255, 215, 0, 0.05) 0%, transparent 50%)'
                }}
            >
                <div className="bg-white/95 backdrop-blur-sm p-8 rounded-2xl shadow-2xl w-full max-w-md border border-gray-200">
                    <div className="text-center mb-8">
                        <div className="w-20 h-20 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                            <span className="text-black font-bold text-3xl">U</span>
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Panel</h1>
                        <p className="text-gray-600 text-lg">Umar Perfume</p>
                        <div className="w-16 h-1 bg-gradient-to-r from-yellow-400 to-yellow-600 mx-auto mt-3 rounded-full"></div>
                    </div>
                    
                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-gray-700 font-semibold mb-2">Ism</label>
                                <input
                                    type="text"
                                    value={loginData.firstName}
                                    onChange={(e) => setLoginData({...loginData, firstName: e.target.value})}
                                    className="w-full border-2 border-gray-200 rounded-xl p-3 text-gray-900 focus:border-yellow-400 focus:ring-0 transition-colors"
                                    placeholder="Ismingizni kiriting"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-gray-700 font-semibold mb-2">Familiya</label>
                                <input
                                    type="text"
                                    value={loginData.lastName}
                                    onChange={(e) => setLoginData({...loginData, lastName: e.target.value})}
                                    className="w-full border-2 border-gray-200 rounded-xl p-3 text-gray-900 focus:border-yellow-400 focus:ring-0 transition-colors"
                                    placeholder="Familiyangizni kiriting"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-gray-700 font-semibold mb-2">Telefon raqam</label>
                                <input
                                    type="text"
                                    value={loginData.phone}
                                    onChange={(e) => setLoginData({...loginData, phone: e.target.value})}
                                    className="w-full border-2 border-gray-200 rounded-xl p-3 text-gray-900 focus:border-yellow-400 focus:ring-0 transition-colors"
                                    placeholder="Telefon raqamingizni kiriting"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-gray-700 font-semibold mb-2">Parol</label>
                                <input
                                    type="password"
                                    value={loginData.password}
                                    onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                                    className="w-full border-2 border-gray-200 rounded-xl p-3 text-gray-900 focus:border-yellow-400 focus:ring-0 transition-colors"
                                    placeholder="Parolingizni kiriting&apos;"
                                    required
                                />
                            </div>
                        </div>
                        <button
                            type="submit"
                            className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black font-bold py-3 px-4 rounded-xl transition-all duration-200 transform hover:scale-[1.02] shadow-lg"
                        >
                            Kirish
                        </button>
                    </form>
                </div>
            </div>
        );
    }
    
    return (
        <div className="min-h-screen bg-gray-50 relative">
            {shouldShowGlobalLoader && (
                <div className="fixed inset-0 bg-white/70 backdrop-blur-sm flex flex-col items-center justify-center z-40">
                    <div className="w-14 h-14 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-gray-700 font-semibold text-center px-6">Ma&apos;lumotlar yuklanmoqda...</p>
                </div>
            )}
            {/* Header */}
            <header className="bg-white shadow-lg border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between min-h-[4rem] py-4 sm:py-0">
                        <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-xl flex items-center justify-center shadow-lg">
                                <span className="text-black font-bold text-xl">U</span>
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Umar Perfume</h1>
                                <p className="text-sm text-gray-500">Admin Panel</p>
                            </div>
                        </div>
                        
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={() => setShowAdminModal(true)}
                                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-xl transition-colors"
                            >
                                <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                                    {adminInfo.firstName.charAt(0)}
                                </div>
                                <span className="font-medium">{adminInfo.firstName} {adminInfo.lastName}</span>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>
                            <button
                                onClick={logoutAdmin}
                                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl font-medium transition-colors flex items-center"
                            >
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                                Chiqish
                            </button>
                        </div>
                    </div>
                </div>
            </header>
            
            {/* Navigation Tabs */}
            <nav className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-wrap gap-4 sm:gap-6 lg:gap-8 overflow-x-auto py-2">
                        {[
                            { key: 'dashboard', name: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
                            { key: 'users', name: 'Foydalanuvchilar', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z' },
                            { key: 'orders', name: 'Buyurtmalar', icon: 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z' },
                            { key: 'products', name: 'Mahsulotlar', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
                            ...(adminInfo.role === 'super_admin' ? [{ key: 'admins', name: 'Adminlar', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.031 9-11.622 0-1.042-.133-2.052-.382-3.016z' }] : [])
                        ].map(tab => (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors flex items-center ${
                                    activeTab === tab.key
                                        ? 'border-yellow-500 text-yellow-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
                                </svg>
                                {tab.name}
                            </button>
                        ))}
                    </div>
                </div>
            </nav>
            
            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Debug info - faqat development uchun */}
                {process.env.NODE_ENV === 'development' && (
                    <div className="mb-4 p-2 bg-yellow-100 text-xs text-gray-600 rounded">
                        Debug: activeTab = {activeTab}, isLoggedIn = {isLoggedIn ? 'true' : 'false'}, users = {users.length}, orders = {orders.length}, products = {products.length}
                    </div>
                )}
                
                {activeTab === 'dashboard' && isLoggedIn && (
                    <div className="space-y-6">
                        {/* Dashboard Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {/* Total Users */}
                            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-500 mb-1">Jami Foydalanuvchilar</p>
                                        <p className="text-3xl font-bold text-gray-900">{users.length}</p>
                                    </div>
                                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            {/* Total Orders */}
                            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-500 mb-1">Jami Buyurtmalar</p>
                                        <p className="text-3xl font-bold text-gray-900">{orders.length}</p>
                                    </div>
                                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                                        <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            {/* Total Products */}
                            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-500 mb-1">Jami Mahsulotlar</p>
                                        <p className="text-3xl font-bold text-gray-900">{products.length}</p>
                                    </div>
                                    <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                                        <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            {/* Recent Registrations */}
                            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-500 mb-1">Yangi Ro'yxatdan O'tganlar</p>
                                        <p className="text-3xl font-bold text-gray-900">
                                            {users.filter(user => {
                                                if (!user.createdAt) return false;
                                                const created = new Date(user.createdAt);
                                                const now = new Date();
                                                const diffTime = Math.abs(now - created);
                                                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                                                return diffDays <= 30;
                                            }).length}
                                        </p>
                                        <p className="text-xs text-gray-400 mt-1">So'ngi 30 kun</p>
                                    </div>
                                    <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                                        <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Charts Row */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Users Registration Chart */}
                            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                                <h3 className="text-lg font-bold text-gray-900 mb-4">Foydalanuvchilar Ro'yxatdan O'tish Grafigi</h3>
                                <div className="h-64">
                                    <canvas id="usersChart"></canvas>
                                </div>
                            </div>

                            {/* Orders Chart */}
                            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                                <h3 className="text-lg font-bold text-gray-900 mb-4">Buyurtmalar Grafigi</h3>
                                <div className="h-64">
                                    <canvas id="ordersChart"></canvas>
                                </div>
                            </div>
                        </div>

                        {/* Orders Status Chart */}
                        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                            <h3 className="text-lg font-bold text-gray-900 mb-4">Buyurtmalar Holati</h3>
                            <div className="h-64">
                                <canvas id="ordersStatusChart"></canvas>
                            </div>
                        </div>

                        {/* Recent Activity */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Recent Users */}
                            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                                <h3 className="text-lg font-bold text-gray-900 mb-4">So'ngi Ro'yxatdan O'tganlar</h3>
                                <div className="space-y-3">
                                    {users
                                        .sort((a, b) => {
                                            const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
                                            const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
                                            return dateB - dateA;
                                        })
                                        .slice(0, 5)
                                        .map((user) => (
                                            <div key={user.id || user.uid} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                                <div>
                                                    <p className="font-semibold text-gray-900">{user.firstName} {user.lastName}</p>
                                                    <p className="text-sm text-gray-500">{user.phoneNumber}</p>
                                                </div>
                                                <span className="text-xs text-gray-400">
                                                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString('uz-UZ') : 'Noma\'lum'}
                                                </span>
                                            </div>
                                        ))}
                                    {users.length === 0 && (
                                        <p className="text-gray-500 text-center py-4">Hozircha foydalanuvchilar yo'q</p>
                                    )}
                                </div>
                            </div>

                            {/* Recent Orders */}
                            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                                <h3 className="text-lg font-bold text-gray-900 mb-4">So'ngi Buyurtmalar</h3>
                                <div className="space-y-3">
                                    {orders
                                        .sort((a, b) => {
                                            const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
                                            const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
                                            return dateB - dateA;
                                        })
                                        .slice(0, 5)
                                        .map((order) => (
                                            <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                                <div>
                                                    <p className="font-semibold text-gray-900">{order.productName}</p>
                                                    <p className="text-sm text-gray-500">{order.customerInfo?.firstName} {order.customerInfo?.lastName}</p>
                                                </div>
                                                <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(order.status)}`}>
                                                    {order.status === 'pending' ? 'Kutilmoqda' : 
                                                     order.status === 'confirmed' ? 'Tasdiqlandi' :
                                                     order.status === 'delivered' ? 'Yetkazildi' :
                                                     order.status === 'cancelled' ? 'Bekor qilindi' : order.status}
                                                </span>
                                            </div>
                                        ))}
                                    {orders.length === 0 && (
                                        <p className="text-gray-500 text-center py-4">Hozircha buyurtmalar yo'q</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Additional Statistics */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Total Revenue (from orders) */}
                            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-lg p-6 text-white">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-green-100 mb-1">Jami Daromad</p>
                                        <p className="text-2xl font-bold">
                                            {new Intl.NumberFormat('uz-UZ').format(
                                                orders.reduce((sum, order) => sum + (parseFloat(order.totalPrice) || 0), 0)
                                            )} so'm
                                        </p>
                                    </div>
                                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            {/* Pending Orders */}
                            <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-2xl shadow-lg p-6 text-white">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-yellow-100 mb-1">Kutilayotgan Buyurtmalar</p>
                                        <p className="text-2xl font-bold">
                                            {orders.filter(o => o.status === 'pending').length}
                                        </p>
                                    </div>
                                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            {/* Delivered Orders */}
                            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg p-6 text-white">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-blue-100 mb-1">Yetkazilgan Buyurtmalar</p>
                                        <p className="text-2xl font-bold">
                                            {orders.filter(o => o.status === 'delivered').length}
                                        </p>
                                    </div>
                                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Welcome Message */}
                        <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-2xl shadow-lg p-6 md:p-8">
                            <h2 className="text-2xl md:text-3xl font-bold text-black mb-2">
                                Xush kelibsiz, {adminInfo.firstName} {adminInfo.lastName}!
                            </h2>
                            <p className="text-black/80 text-base md:text-lg">
                                Admin panel orqali barcha ma'lumotlarni boshqaring va kuzatib boring.
                            </p>
                        </div>
                    </div>
                )}
                
                {activeTab === 'users' && (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
            <div className="p-8 border-b border-gray-100">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                            <svg className="w-8 h-8 mr-3 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                            </svg>
                            Foydalanuvchilar
                        </h2>
                        <p className="text-gray-500 mt-1">Ro'yxatdan o'tgan foydalanuvchilar</p>
                    </div>
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-2 rounded-xl">
                        <span className="text-blue-600 font-semibold">Jami: {users.length}</span>
                    </div>
                </div>
            </div>
            <div className="p-8">
                            {users.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ism</th>
                                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Familiya</th>
                                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Telefon</th>
                                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sana</th>
                                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Holati</th>
                                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amallar</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {users.map(user => (
                                                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.firstName}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.lastName}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.phoneNumber}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString('uz-UZ') : 'N/A'}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                                                            (user.status || 'active') === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                        }`}>
                                                            {(user.status || 'active') === 'active' ? 'Faol' : 'Bloklangan'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                                                        <button
                                                            onClick={() => toggleUserBlock(user.id, user.status || 'active')}
                                                            disabled={isLoading}
                                                            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 ${
                                                                (user.status || 'active') === 'active' 
                                                                    ? 'bg-red-100 hover:bg-red-200 text-red-600' 
                                                                    : 'bg-green-100 hover:bg-green-200 text-green-600'
                                                            }`}
                                                        >
                                                            {(user.status || 'active') === 'active' ? 'Bloklash' : 'Faollashtirish'}
                                                        </button>
                                                        <button
                                                            onClick={() => deleteUser(user.id)}
                                                            disabled={isLoading}
                                                            className="bg-gray-100 hover:bg-gray-200 text-gray-600 px-3 py-1 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                                                        >
                                                            O&apos;chirish
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                <div className="text-center py-12">
                    <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">Hech qanday foydalanuvchi yo'q</h3>
                    <p className="text-gray-500">Foydalanuvchilar ro'yxatdan o'tganda bu yerda ko'rinadi</p>
                </div>
                            )}
            </div>
        </div>
                )}
    
                {activeTab === 'orders' && (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
            <div className="p-8 border-b border-gray-100">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                            <svg className="w-8 h-8 mr-3 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                            </svg>
                            Buyurtmalar
                        </h2>
                        <p className="text-gray-500 mt-1">Barcha buyurtmalar tarixi</p>
                    </div>
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-4 py-2 rounded-xl">
                        <span className="text-green-600 font-semibold">Jami: {orders.length}</span>
                    </div>
                </div>
            </div>
            <div className="p-8">
                {/* Filters and Actions */}
                <div className="mb-6 flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                        <label className="text-sm font-medium text-gray-700">Vaqt filtri:</label>
                        <select
                            value={orderTimeFilter}
                            onChange={(e) => {
                                setOrderTimeFilter(e.target.value);
                                setSelectedOrders([]);
                                setSelectAllOrders(false);
                            }}
                            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
                        >
                            <option value="all">Barchasi</option>
                            <option value="1week">So'nggi 1 hafta</option>
                            <option value="1month">So'nggi 1 oy</option>
                            <option value="older">1 oydan oldingi</option>
                        </select>
                    </div>
                    {selectedOrders.length > 0 && (
                        <button
                            onClick={deleteSelectedOrders}
                            disabled={isLoading}
                            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center"
                        >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            {selectedOrders.length} ta buyurtmani o'chirish
                        </button>
                    )}
                </div>
                
                {orders.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="min-w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-4 text-left">
                                        <input
                                            type="checkbox"
                                            checked={selectAllOrders}
                                            onChange={handleSelectAllOrders}
                                            className="w-4 h-4 text-yellow-600 border-gray-300 rounded focus:ring-yellow-500"
                                        />
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mijoz</th>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Telefon</th>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mahsulot</th>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Narx</th>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amallar</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {getFilteredOrders().map(order => (
                                    <tr key={order.id} className={`hover:bg-gray-50 transition-colors ${selectedOrders.includes(order.id) ? 'bg-yellow-50' : ''}`}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <input
                                                type="checkbox"
                                                checked={selectedOrders.includes(order.id)}
                                                onChange={() => handleOrderSelect(order.id)}
                                                className="w-4 h-4 text-yellow-600 border-gray-300 rounded focus:ring-yellow-500"
                                            />
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {order.customerInfo ? `${order.customerInfo.firstName} ${order.customerInfo.lastName}` : order.customerName || 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {order.customerInfo ? order.customerInfo.phoneNumber : order.phone || 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            <div>
                                                <div className="font-medium">{order.productName || order.product || 'N/A'}</div>
                                                {order.size && <div className="text-gray-500 text-xs">O'lcham: {order.size}</div>}
                                                {order.quantity && <div className="text-gray-500 text-xs">Miqdor: {order.quantity}</div>}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                                            {order.totalPrice ? `${order.totalPrice.toLocaleString()} so'm` : `${order.price || 0} so'm`}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                                                {getStatusText(order.status)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            <div className="flex space-x-2">
                                                {order.status === 'pending' && (
                                                    <>
                                                        <button
                                                            onClick={() => showConfirmModal(
                                                                'Buyurtmani qabul qilish',
                                                                'Ushbu buyurtmani qabul qilmoqchimisiz?',
                                                                () => updateOrderStatus(order.id, 'confirmed'),
                                                                'info'
                                                            )}
                                                            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-md text-xs font-medium transition-colors"
                                                        >
                                                            Qabul qilish
                                                        </button>
                                                        <button
                                                            onClick={() => showConfirmModal(
                                                                'Buyurtmani rad etish',
                                                                'Ushbu buyurtmani rad etmoqchimisiz?',
                                                                () => updateOrderStatus(order.id, 'cancelled'),
                                                                'error'
                                                            )}
                                                            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md text-xs font-medium transition-colors"
                                                        >
                                                            Rad etish
                                                        </button>
                                                    </>
                                                )}
                                                {order.status === 'confirmed' && (
                                                    <button
                                                        onClick={() => showConfirmModal(
                                                            'Buyurtmani yetkazish',
                                                            'Ushbu buyurtma yetkazilganini tasdiqlaysizmi?',
                                                            () => updateOrderStatus(order.id, 'delivered'),
                                                            'success'
                                                        )}
                                                        className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-md text-xs font-medium transition-colors"
                                                    >
                                                        Yetkazildi
                                                    </button>
                                                )}
                                                {(order.status === 'delivered' || order.status === 'cancelled') && (
                                                    <span className="text-gray-500 text-xs">Yakunlangan</span>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                            ) : (
                <div className="text-center py-12">
                    <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">Hech qanday buyurtma yo&apos;q</h3>
                    <p className="text-gray-500">Mijozlar buyurtma berganda bu yerda ko&apos;rinadi</p>
                </div>
                            )}
            </div>
        </div>
                )}
    
                {activeTab === 'products' && (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
            <div className="p-8 border-b border-gray-100">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                            <svg className="w-8 h-8 mr-3 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                            Mahsulotlar
                                        {isLoading && <span className="ml-2 text-sm text-gray-500">(Yuklanmoqda...)</span>}
                        </h2>
                        <p className="text-gray-500 mt-1">Barcha mahsulotlar ro&apos;yxati</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="bg-gradient-to-r from-purple-50 to-pink-50 px-4 py-2 rounded-xl">
                            <span className="text-purple-600 font-semibold">Jami: {products.length}</span>
                        </div>
                        <button
                            onClick={() => setShowFilterSettingsModal(true)}
                            className="flex items-center px-5 py-2.5 rounded-xl border border-yellow-400 text-yellow-600 hover:bg-yellow-50 transition-colors font-semibold shadow-sm bg-white"
                        >
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.25 3.75a.75.75 0 011.5 0v1.26a5.25 5.25 0 011.84.76l1.08-.62a.75.75 0 011.03.28l1.5 2.598a.75.75 0 01-.28 1.03l-1.09.63a5.27 5.27 0 010 1.52l1.09.63a.75.75 0 01.28 1.03l-1.5 2.598a.75.75 0 01-1.03.28l-1.08-.62a5.25 5.25 0 01-1.84.76v1.26a.75.75 0 01-1.5 0v-1.26a5.25 5.25 0 01-1.84-.76l-1.08.62a.75.75 0 01-1.03-.28l-1.5-2.598a.75.75 0 01.28-1.03l1.09-.63a5.27 5.27 0 010-1.52l-1.09-.63a.75.75 0 01-.28-1.03l1.5-2.598a.75.75 0 011.03-.28l1.08.62a5.25 5.25 0 011.84-.76V3.75z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9.75a2.25 2.25 0 100 4.5 2.25 2.25 0 000-4.5z" />
                            </svg>
                            Mahsulot sozlamalari
                        </button>
                        <button
                            onClick={() => setShowProductModal(true)}
                                        disabled={isLoading}
                                        className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black font-bold px-6 py-3 rounded-xl transition-all duration-200 transform hover:scale-[1.02] shadow-lg flex items-center disabled:opacity-50"
                        >
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            Mahsulot qo&apos;shish
                        </button>
                    </div>
                </div>
            </div>
            {products.length > 0 ? (
                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mahsulot</th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Brand</th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Narx</th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Soni</th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amallar</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {products.map(product => (
                                <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <img 
                                                src={product.image} 
                                                alt={product.name}
                                                className="w-12 h-12 rounded-lg object-cover mr-4"
                                            />
                                            <div>
                                                <div className="text-sm font-medium text-gray-900">{product.name}</div>
                                                <div className="text-sm text-gray-500">ID: {product.id}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.brand}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">{product.price} so&apos;m</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {product.sizes && product.sizes.length > 0 ? (
                                            <div className="space-y-1">
                                                <div className="font-medium">Jami: {product.stock}</div>
                                                <div className="text-xs text-gray-500">
                                                    {product.sizes.map((size, idx) => (
                                                        <span key={idx} className="block">
                                                            {size.size}: {size.stock || 0} dona
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        ) : (
                                            product.stock
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                                            product.status === 'mavjud' 
                                                ? 'bg-green-100 text-green-800' 
                                                : 'bg-red-100 text-red-800'
                                        }`}>
                                            {product.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                                        <button
                                            onClick={() => openEditModal(product)}
                                            className="bg-blue-100 hover:bg-blue-200 text-blue-600 px-3 py-1 rounded-lg text-xs font-medium transition-colors"
                                        >
                                            Tahrirlash
                                        </button>
                                        <button
                                            onClick={() => deleteProduct(product.id)}
                                            disabled={isLoading}
                                            className="bg-red-100 hover:bg-red-200 text-red-600 px-3 py-1 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                                        >
                                            O&apos;chirish
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                    <div className="text-center py-12">
                        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-semibold text-gray-700 mb-2">Hech qanday mahsulot yo&apos;q</h3>
                        <p className="text-gray-500">Yangi mahsulot qo&apos;shish uchun yuqoridagi tugmani bosing</p>
                    </div>
                        )}
                </div>
            )}
            
            {/* Admin Management Tab - faqat super admin uchun */}
            {activeTab === 'admins' && adminInfo.role === 'super_admin' && (
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
                    <div className="p-8 border-b border-gray-100">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                                    <svg className="w-8 h-8 mr-3 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.031 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                    </svg>
                                    Admin Boshqaruvi
                                </h2>
                                <p className="text-gray-500 mt-1">Tizim administratorlari</p>
                            </div>
                            <div className="flex items-center space-x-4">
                                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 px-4 py-2 rounded-xl">
                                    <span className="text-indigo-600 font-semibold">Jami: {admins.length + 1}</span>
                                </div>
                                <button
                                    onClick={() => setShowAddAdminModal(true)}
                                    className="bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-bold px-6 py-3 rounded-xl transition-all duration-200 transform hover:scale-[1.02] shadow-lg flex items-center"
                                >
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                    </svg>
                                    Admin qo&apos;shish
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Admin</th>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Telefon</th>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rol</th>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sana</th>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Holati</th>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amallar</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {/* Super Admin (current user) */}
                                <tr className="bg-yellow-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="w-10 h-10 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center text-black font-bold text-sm mr-4">
                                                {adminInfo.firstName.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="text-sm font-medium text-gray-900">{adminInfo.firstName} {adminInfo.lastName}</div>
                                                <div className="text-sm text-gray-500">ID: {adminInfo.id}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">+998{adminInfo.phone}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="px-3 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                                            Super Admin
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(adminInfo.createdAt).toLocaleDateString('uz-UZ')}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                            Faol
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        Siz
                                    </td>
                                </tr>
                                
                                {/* Other Admins */}
                                {admins.map(admin => (
                                    <tr key={admin.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm mr-4">
                                                    {admin.firstName?.charAt(0) || 'A'}
                                                </div>
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">{admin.firstName} {admin.lastName}</div>
                                                    <div className="text-sm text-gray-500">ID: {admin.id}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{admin.phone}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                                Admin
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {admin.createdAt ? new Date(admin.createdAt).toLocaleDateString('uz-UZ') : 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                                                (admin.status || 'active') === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                            }`}>
                                                {(admin.status || 'active') === 'active' ? 'Faol' : 'Bloklangan'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                                            <button
                                                onClick={() => openEditAdminModal(admin)}
                                                className="bg-blue-100 hover:bg-blue-200 text-blue-600 px-3 py-1 rounded-lg text-xs font-medium transition-colors"
                                            >
                                                Tahrirlash
                                            </button>
                                            <button
                                                onClick={() => toggleAdminBlock(admin.id, admin.status || 'active')}
                                                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                                                    (admin.status || 'active') === 'active' 
                                                        ? 'bg-red-100 hover:bg-red-200 text-red-600' 
                                                        : 'bg-green-100 hover:bg-green-200 text-green-600'
                                                }`}
                                            >
                                                {(admin.status || 'active') === 'active' ? 'Bloklash' : 'Faollashtirish'}
                                            </button>
                                            <button
                                                onClick={() => deleteAdmin(admin.id)}
                                                className="bg-gray-100 hover:bg-gray-200 text-gray-600 px-3 py-1 rounded-lg text-xs font-medium transition-colors"
                                            >
                                                O&apos;chirish
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    
                    {admins.length === 0 && (
                        <div className="text-center py-12">
                            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-semibold text-gray-700 mb-2">Boshqa adminlar yo&apos;q</h3>
                            <p className="text-gray-500">Yangi admin qo&apos;shish uchun yuqoridagi tugmani bosing</p>
                        </div>
                    )}
                </div>
            )}
            </main>
            
            {/* Filter Settings Modal */}
            {showFilterSettingsModal && (
                <div 
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) {
                            setShowFilterSettingsModal(false);
                            cancelBrandEdit();
                        }
                    }}
                >
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-2xl">
                            <div className="flex flex-wrap items-center justify-between gap-4">
                                <div>
                                    <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                                        <svg className="w-7 h-7 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.25 3.75a.75.75 0 011.5 0v1.26a5.25 5.25 0 011.84.76l1.08-.62a.75.75 0 011.03.28l1.5 2.598a.75.75 0 01-.28 1.03l-1.09.63a5.27 5.27 0 010 1.52l1.09.63a.75.75 0 01.28 1.03l-1.5 2.598a.75.75 0 01-1.03.28l-1.08-.62a5.25 5.25 0 01-1.84.76v1.26a.75.75 0 01-1.5 0v-1.26a5.25 5.25 0 01-1.84-.76l-1.08.62a.75.75 0 01-1.03-.28l-1.5-2.598a.75.75 0 01.28-1.03l1.09-.63a5.27 5.27 0 010-1.52l-1.09-.63a.75.75 0 01-.28-1.03l1.5-2.598a.75.75 0 011.03-.28l1.08.62a5.25 5.25 0 011.84-.76V3.75z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9.75a2.25 2.25 0 100 4.5 2.25 2.25 0 000-4.5z" />
                                        </svg>
                                        Filtr sozlamalari
                                    </h3>
                                    <p className="text-gray-500 mt-1">
                                        Client tarafdagi mahsulot filtrlari ushbu ro&apos;yxatlardan foydalanadi.
                                    </p>
                                </div>
                                <div className="flex items-center gap-3">
                                    {catalogSaving && (
                                        <div className="flex items-center text-yellow-600 text-sm font-semibold">
                                            <span className="w-4 h-4 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin mr-2"></span>
                                            Saqlanmoqda...
                                        </div>
                                    )}
                                    <button
                                        onClick={() => {
                                            setShowFilterSettingsModal(false);
                                            cancelBrandEdit();
                                        }}
                                        className="text-gray-400 hover:text-gray-600 w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
                                    >
                                        ✕
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 space-y-6">
                            {catalogLoading ? (
                                <div className="flex flex-col items-center justify-center py-20 text-center text-gray-600">
                                    <span className="w-10 h-10 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mb-4"></span>
                                    Sozlamalar yuklanmoqda...
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5">
                                        <div className="flex items-start justify-between mb-4">
                                            <div>
                                                <h4 className="text-lg font-semibold text-gray-900">Brendlar ro&apos;yxati</h4>
                                                <p className="text-sm text-gray-500">
                                                    Filtrda ko&apos;rinadigan brendlarni shu yerda boshqaring.
                                                </p>
                                            </div>
                                            <span className="text-xs font-medium text-gray-500 bg-white border border-gray-200 px-3 py-1 rounded-full">
                                                {availableBrands.length} ta
                                            </span>
                                        </div>

                                        <div className="flex flex-col sm:flex-row gap-3 mb-4">
                                            <input
                                                type="text"
                                                value={newBrand}
                                                onChange={(e) => setNewBrand(e.target.value)}
                                                className="flex-1 border-2 border-gray-200 rounded-xl p-3 focus:border-yellow-400 focus:ring-0 transition-colors"
                                                placeholder="Yangi brend nomi"
                                            />
                                            <button
                                                onClick={handleAddBrand}
                                                disabled={catalogSaving || !newBrand.trim()}
                                                className="whitespace-nowrap bg-yellow-500 hover:bg-yellow-600 text-black font-semibold px-5 py-3 rounded-xl transition-colors disabled:opacity-50"
                                            >
                                                Qo&apos;shish
                                            </button>
                                        </div>

                                        <div className="space-y-2 max-h-64 overflow-y-auto pr-1 custom-scrollbar">
                                            {availableBrands.length === 0 && (
                                                <div className="text-sm text-gray-500 bg-white border border-dashed border-gray-300 rounded-xl p-4 text-center">
                                                    Hozircha brend qo&apos;shilmagan.
                                                </div>
                                            )}
                                            {availableBrands.map((brand) => (
                                                <div
                                                    key={brand}
                                                    className="bg-white border border-gray-200 rounded-xl px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                                                >
                                                    {editingBrand === brand ? (
                                                        <>
                                                            <input
                                                                type="text"
                                                                value={editingBrandValue}
                                                                onChange={(e) => setEditingBrandValue(e.target.value)}
                                                                className="flex-1 border border-yellow-300 rounded-lg px-3 py-2 focus:outline-none focus:border-yellow-500"
                                                                placeholder="Brend nomini kiriting"
                                                            />
                                                            <div className="flex items-center gap-2">
                                                                <button
                                                                    onClick={handleSaveBrandEdit}
                                                                    disabled={catalogSaving || !editingBrandValue.trim()}
                                                                    className="bg-green-500 hover:bg-green-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                                                                >
                                                                    Saqlash
                                                                </button>
                                                                <button
                                                                    onClick={cancelBrandEdit}
                                                                    className="bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                                                                >
                                                                    Bekor qilish
                                                                </button>
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <span className="font-semibold text-gray-800">{brand}</span>
                                                            <div className="flex items-center gap-2">
                                                                <button
                                                                    onClick={() => startEditBrand(brand)}
                                                                    className="bg-blue-100 hover:bg-blue-200 text-blue-600 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                                                                >
                                                                    Tahrirlash
                                                                </button>
                                                                <button
                                                                    onClick={() => handleRemoveBrand(brand)}
                                                                    disabled={catalogSaving}
                                                                    className="bg-red-100 hover:bg-red-200 text-red-600 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                                                                >
                                                                    O&apos;chirish
                                                                </button>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5">
                                        <div className="flex items-start justify-between mb-4">
                                            <div>
                                                <h4 className="text-lg font-semibold text-gray-900">Atir notalari</h4>
                                                <p className="text-sm text-gray-500">
                                                    Mahsulotlar uchun mavjud bo&apos;lgan nota variantlari.
                                                </p>
                                            </div>
                                            <span className="text-xs font-medium text-gray-500 bg-white border border-gray-200 px-3 py-1 rounded-full">
                                                {availableNotes.length} ta
                                            </span>
                                        </div>

                                        <div className="flex flex-col sm:flex-row gap-3 mb-4">
                                            <input
                                                type="text"
                                                value={newNote}
                                                onChange={(e) => setNewNote(e.target.value)}
                                                className="flex-1 border-2 border-gray-200 rounded-xl p-3 focus:border-yellow-400 focus:ring-0 transition-colors"
                                                placeholder="Masalan: Atirgul, Oq mushk"
                                            />
                                            <button
                                                onClick={addNote}
                                                disabled={catalogSaving || !newNote.trim()}
                                                className="whitespace-nowrap bg-yellow-500 hover:bg-yellow-600 text-black font-semibold px-5 py-3 rounded-xl transition-colors disabled:opacity-50"
                                            >
                                                Qo&apos;shish
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto pr-1 custom-scrollbar">
                                            {availableNotes.length === 0 && (
                                                <div className="text-sm text-gray-500 bg-white border border-dashed border-gray-300 rounded-xl p-4 text-center">
                                                    Hozircha nota qo&apos;shilmagan.
                                                </div>
                                            )}
                                            {availableNotes.map((note) => (
                                                <div
                                                    key={note}
                                                    className="bg-white border border-gray-200 rounded-xl px-4 py-2 flex items-center justify-between"
                                                >
                                                    <span className="font-medium text-gray-800">{note}</span>
                                                    <button
                                                        onClick={() => removeNote(note)}
                                                        disabled={catalogSaving}
                                                        className="bg-red-100 hover:bg-red-200 text-red-600 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                                                    >
                                                        O&apos;chirish
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="px-6 pb-6 text-right">
                            <button
                                onClick={() => {
                                    setShowFilterSettingsModal(false);
                                    cancelBrandEdit();
                                }}
                                className="inline-flex items-center bg-gray-900 hover:bg-black text-white font-semibold px-6 py-3 rounded-xl transition-colors"
                            >
                                Yopish
                            </button>
                        </div>
                    </div>
                </div>
            )}

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
            
            {/* Product Modal */}
            {showProductModal && (
            <div 
                className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                onClick={(e) => e.target === e.currentTarget && setShowProductModal(false)}
            >
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                    <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-2xl">
                        <div className="flex items-center justify-between">
                            <h3 className="text-2xl font-bold text-gray-900 flex items-center">
                                <svg className="w-8 h-8 mr-3 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                                {isEditMode ? 'Mahsulotni tahrirlash' : 'Yangi mahsulot qo&apos;shish'}
                            </h3>
                            <button 
                                onClick={closeProductModal}
                                className="text-gray-400 hover:text-gray-600 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
                            >
                                ✕
                            </button>
                        </div>
                    </div>
                    
                    <form onSubmit={isEditMode ? handleProductUpdate : handleProductSubmit} className="p-6 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-gray-700 font-semibold mb-2">Mahsulot rasmi *</label>
                                <input 
                                    type="file" 
                                    accept="image/*"
                                    onChange={handleProductImageChange}
                                    className="w-full border-2 border-dashed border-gray-300 rounded-xl p-4 text-center hover:border-yellow-400 transition-colors cursor-pointer"
                                    required={!isEditMode}
                                />
                                {productImagePreview && (
                                    <div className="mt-3">
                                        <img 
                                            src={productImagePreview} 
                                            alt="Preview" 
                                            className="w-full h-48 object-cover rounded-lg border-2 border-gray-200"
                                        />
                                    </div>
                                )}
                            </div>
                            <div>
                                <label className="block text-gray-700 font-semibold mb-2">Mahsulot nomi *</label>
                                <input
                                    type="text"
                                    value={newProduct.name}
                                    onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                                    className="w-full border-2 border-gray-200 rounded-xl p-3 focus:border-yellow-400 focus:ring-0 transition-colors"
                                    placeholder="Masalan: Chanel No. 5"
                                    required
                                />
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-gray-700 font-semibold mb-2">Brand *</label>
                                <div className="flex flex-col sm:flex-row gap-2">
                                    <input
                                        type="text"
                                        list="brand-options"
                                        value={newProduct.brand}
                                        onChange={(e) => setNewProduct({...newProduct, brand: e.target.value})}
                                        className="w-full border-2 border-gray-200 rounded-xl p-3 focus:border-yellow-400 focus:ring-0 transition-colors"
                                        placeholder="Masalan: Chanel"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowFilterSettingsModal(true)}
                                        className="sm:w-auto w-full inline-flex items-center justify-center px-4 py-3 rounded-xl border border-yellow-400 text-yellow-600 font-semibold hover:bg-yellow-50 transition-colors"
                                    >
                                        Sozlash
                                    </button>
                                </div>
                                <datalist id="brand-options">
                                    {availableBrands.map((brand) => (
                                        <option key={brand} value={brand} />
                                    ))}
                                </datalist>
                            </div>
                            <div>
                                <label className="block text-gray-700 font-semibold mb-2">Asosiy narx *</label>
                                <input
                                    type="text"
                                    value={newProduct.price}
                                    onChange={(e) => setNewProduct({...newProduct, price: e.target.value})}
                                    className="w-full border-2 border-gray-200 rounded-xl p-3 focus:border-yellow-400 focus:ring-0 transition-colors"
                                    placeholder="Masalan: 850000"
                                    required
                                />
                            </div>
                        </div>
                        
                        <div>
                            <label className="block text-gray-700 font-semibold mb-2">Jins *</label>
                            <select
                                value={newProduct.category}
                                onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}
                                className="w-full border-2 border-gray-200 rounded-xl p-3 focus:border-yellow-400 focus:ring-0 transition-colors"
                                required
                            >
                                <option value="erkak">Erkaklar uchun</option>
                                <option value="ayol">Ayollar uchun</option>
                                <option value="unisex">Barcha uchun</option>
                            </select>
                        </div>
                        
                        <div>
                            <label className="block text-gray-700 font-semibold mb-2">Tavsif</label>
                            <textarea
                                value={newProduct.description}
                                onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                                className="w-full border-2 border-gray-200 rounded-xl p-3 focus:border-yellow-400 focus:ring-0 transition-colors"
                                rows={3}
                                placeholder="Mahsulot haqida qisqacha ma&apos;lumot..."
                            />
                        </div>
                        
                        {/* Hid notalari */}
                        <div className="border-t border-gray-200 pt-6">
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="text-lg font-semibold text-gray-900 flex items-center">
                                    <svg className="w-6 h-6 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                    </svg>
                                    Hid notalari ({newProduct.fragranceNotes.length} tanlandi)
                                </h4>
                                <button
                                    type="button"
                                    onClick={() => setShowNotesSettings(!showNotesSettings)}
                                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                >
                                    {showNotesSettings ? 'Yashirish' : 'Sozlamalar'}
                                </button>
                            </div>
                            
                            {/* Notalar sozlamalari */}
                            {showNotesSettings && (
                                <div className="bg-blue-50 p-4 rounded-xl mb-4">
                                    <h5 className="font-medium text-gray-900 mb-3">Yangi nota qo&apos;shish</h5>
                                    <div className="flex space-x-2">
                                        <input
                                            type="text"
                                            value={newNote}
                                            onChange={(e) => setNewNote(e.target.value)}
                                            className="flex-1 border-2 border-gray-200 rounded-lg p-2"
                                            placeholder="Yangi nota nomi..."
                                        />
                                        <button
                                            type="button"
                                            onClick={addNote}
                                            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
                                        >
                                            Qo'shish
                                        </button>
                                    </div>
                                </div>
                            )}
                            
                            {/* Notalar ro'yxati */}
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                                {availableNotes.map((note, index) => (
                                    <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded-lg">
                                        <label className="flex items-center flex-1 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={newProduct.fragranceNotes.includes(note)}
                                                onChange={() => toggleNote(note)}
                                                className="mr-2 text-green-500 focus:ring-green-400"
                                            />
                                            <span className="text-sm text-gray-700">{note}</span>
                                        </label>
                                        {showNotesSettings && (
                                            <button
                                                type="button"
                                                onClick={() => removeNote(note)}
                                                className="text-red-500 hover:text-red-700 text-xs ml-2"
                                            >
                                                ×
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                        
                        <div className="border-t border-gray-200 pt-6">
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="text-lg font-semibold text-gray-900 flex items-center">
                                    <svg className="w-6 h-6 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17v4a2 2 0 002 2h4M13 5v4a2 2 0 002 2h4" />
                                    </svg>
                                    O&apos;lchamlar va narxlar
                                </h4>
                                <button
                                    type="button"
                                    onClick={addProductSize}
                                    className="flex items-center px-4 py-2.5 bg-gradient-to-r from-yellow-400 to-yellow-500 text-white rounded-xl text-sm font-bold shadow-lg hover:shadow-xl hover:from-yellow-500 hover:to-yellow-600 transition-all duration-200 transform hover:scale-105"
                                >
                                    <svg className="w-5 h-5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                                    </svg>
                                    O&apos;lcham qo&apos;shish
                                </button>
                            </div>

                            {/* O'lchamlar ro'yxati - inline form */}
                            <div className="space-y-3 max-h-72 overflow-y-auto pr-2 custom-scrollbar">
                                {newProduct.sizes.length > 0 ? (
                                    newProduct.sizes.map((size, index) => (
                                        <div key={index} className="bg-gradient-to-br from-white via-gray-50 to-white border-2 border-gray-200 rounded-xl p-4 shadow-md hover:shadow-lg hover:border-yellow-300 transition-all duration-300">
                                            <div className="flex items-center justify-between mb-3">
                                                <span className="text-xs font-bold text-white bg-gradient-to-r from-yellow-400 to-yellow-500 px-3 py-1 rounded-full shadow-sm">#{index + 1}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => removeProductSize(index)}
                                                    className="text-white bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105"
                                                >
                                                    ✕ O&apos;chirish
                                                </button>
                                            </div>
                                            
                                            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                                                <div>
                                                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">O&apos;lcham</label>
                                                    <input
                                                        type="text"
                                                        value={size.size || ''}
                                                        onChange={(e) => updateProductSize(index, 'size', e.target.value)}
                                                        className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm bg-white shadow-sm focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400 focus:ring-opacity-30 transition-all duration-200 hover:border-gray-300"
                                                        placeholder="5ml, 10ml..."
                                                        required
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Narx</label>
                                                    <input
                                                        type="text"
                                                        value={size.price || ''}
                                                        onChange={(e) => updateProductSize(index, 'price', e.target.value)}
                                                        className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm bg-white shadow-sm focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400 focus:ring-opacity-30 transition-all duration-200 hover:border-gray-300"
                                                        placeholder="130000"
                                                        required
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Soni</label>
                                                    <input
                                                        type="text"
                                                        value={size.stock || ''}
                                                        onChange={(e) => updateProductSize(index, 'stock', e.target.value)}
                                                        className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm bg-white shadow-sm focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400 focus:ring-opacity-30 transition-all duration-200 hover:border-gray-300"
                                                        placeholder="5"
                                                        required
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Rasm</label>
                                                    <div className="flex items-center space-x-2">
                                                        <label className="flex-1 cursor-pointer">
                                                            <input
                                                                type="file"
                                                                accept="image/*"
                                                                onChange={(e) => handleSizeImageChange(index, e)}
                                                                className="hidden"
                                                            />
                                                            <div className="border-2 border-dashed border-gray-300 rounded-lg px-3 py-2 text-xs bg-gradient-to-r from-gray-50 to-white hover:border-yellow-400 hover:bg-gradient-to-r hover:from-yellow-50 hover:to-yellow-100 transition-all duration-200 shadow-sm hover:shadow-md text-center font-medium text-gray-600">
                                                                📷 Rasm tanlash
                                                            </div>
                                                        </label>
                                                        {size.imageName && (
                                                            <div className="relative">
                                                                <img 
                                                                    src={size.imageName} 
                                                                    alt={`Size ${index + 1}`} 
                                                                    className="w-10 h-10 object-cover rounded-lg border-2 border-gray-300 shadow-md"
                                                                />
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 border-2 border-yellow-200 text-yellow-800 px-4 py-4 rounded-xl text-sm text-center shadow-sm">
                                        <p className="font-medium">Hozircha o&apos;lcham qo&apos;shilmagan.</p>
                                        <p className="text-xs mt-1">Yuqoridagi &quot;O&apos;lcham qo&apos;shish&quot; tugmasini bosing.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                            <button
                                type="button"
                                onClick={closeProductModal}
                                className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-colors"
                            >
                                Bekor qilish
                            </button>
                            <button
                                type="submit"
                                    disabled={isLoading}
                                    className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black font-bold rounded-xl transition-all duration-200 transform hover:scale-[1.02] shadow-lg disabled:opacity-50"
                            >
                                    {isLoading ? 'Saqlanmoqda...' : isEditMode ? 'Mahsulotni saqlash' : 'Mahsulotni saqlash'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
            )}
            
            {/* Admin Modal */}
            {showAdminModal && (
            <div 
                className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                onClick={(e) => e.target === e.currentTarget && setShowAdminModal(false)}
            >
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
                    <div className="p-6 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-bold text-gray-900 flex items-center">
                                <svg className="w-6 h-6 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                Admin ma'lumotlari
                            </h3>
                            <button 
                                onClick={() => setShowAdminModal(false)}
                                className="text-gray-400 hover:text-gray-600 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
                            >
                                ✕
                            </button>
                        </div>
                    </div>
                    
                    <form onSubmit={handleAdminUpdate} className="p-6 space-y-4">
                        <div>
                            <label className="block text-gray-700 font-semibold mb-2">Ism</label>
                            <input
                                type="text"
                                value={adminInfo.firstName}
                                onChange={(e) => setAdminInfo({...adminInfo, firstName: e.target.value})}
                                className="w-full border-2 border-gray-200 rounded-xl p-3 focus:border-blue-400 focus:ring-0 transition-colors"
                            />
                        </div>
                        <div>
                            <label className="block text-gray-700 font-semibold mb-2">Familiya</label>
                            <input
                                type="text"
                                value={adminInfo.lastName}
                                onChange={(e) => setAdminInfo({...adminInfo, lastName: e.target.value})}
                                className="w-full border-2 border-gray-200 rounded-xl p-3 focus:border-blue-400 focus:ring-0 transition-colors"
                            />
                        </div>
                        <div>
                            <label className="block text-gray-700 font-semibold mb-2">Telefon raqam</label>
                            <input
                                type="text"
                                value={adminInfo.phone}
                                onChange={(e) => setAdminInfo({...adminInfo, phone: e.target.value})}
                                className="w-full border-2 border-gray-200 rounded-xl p-3 focus:border-blue-400 focus:ring-0 transition-colors"
                            />
                        </div>
                        <div>
                            <label className="block text-gray-700 font-semibold mb-2">Parol</label>
                            <input
                                type="password"
                                value={adminInfo.password}
                                onChange={(e) => setAdminInfo({...adminInfo, password: e.target.value})}
                                className="w-full border-2 border-gray-200 rounded-xl p-3 focus:border-blue-400 focus:ring-0 transition-colors"
                            />
                        </div>
                        <div className="flex justify-end space-x-3 pt-4">
                            <button
                                type="button"
                                onClick={() => setShowAdminModal(false)}
                                className="px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
                            >
                                Bekor qilish
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-xl transition-all duration-200"
                            >
                                Saqlash
                            </button>
                        </div>
                    </form>
                </div>
            </div>
            )}
            
            {/* Add Admin Modal */}
            {showAddAdminModal && (
                <div 
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                    onClick={(e) => e.target === e.currentTarget && closeAddAdminModal()}
                >
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col">
                        <div className="p-6 border-b border-gray-200 flex-shrink-0">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xl font-bold text-gray-900 flex items-center">
                                    <svg className="w-6 h-6 mr-2 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                    {isEditAdminMode ? 'Adminni tahrirlash' : 'Yangi admin qo\'shish'}
                                </h3>
                                <button 
                                    onClick={closeAddAdminModal}
                                    className="text-gray-400 hover:text-gray-600 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
                                >
                                    ✕
                                </button>
                            </div>
                        </div>
                        
                        <form onSubmit={isEditAdminMode ? updateAdmin : addAdmin} className="p-6 space-y-4 overflow-y-auto flex-1">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-gray-700 font-semibold mb-2">Ism *</label>
                                    <input
                                        type="text"
                                        value={newAdmin.firstName}
                                        onChange={(e) => setNewAdmin({...newAdmin, firstName: e.target.value})}
                                        className="w-full border-2 border-gray-200 rounded-xl p-3 focus:border-indigo-400 focus:ring-0 transition-colors"
                                        placeholder="Ismni kiriting"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-700 font-semibold mb-2">Familiya *</label>
                                    <input
                                        type="text"
                                        value={newAdmin.lastName}
                                        onChange={(e) => setNewAdmin({...newAdmin, lastName: e.target.value})}
                                        className="w-full border-2 border-gray-200 rounded-xl p-3 focus:border-indigo-400 focus:ring-0 transition-colors"
                                        placeholder="Familiyani kiriting"
                                        required
                                    />
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-gray-700 font-semibold mb-2">Telefon raqam *</label>
                                <div className="flex">
                                    <span className="inline-flex items-center px-3 text-gray-700 bg-gray-100 border-2 border-r-0 border-gray-200 rounded-l-xl font-semibold">
                                        +998
                                    </span>
                                    <input
                                        type="tel"
                                        value={newAdmin.phone}
                                        onChange={(e) => setNewAdmin({...newAdmin, phone: e.target.value.replace(/\D/g, '').slice(0, 9)})}
                                        className="w-full border-2 border-gray-200 rounded-r-xl p-3 focus:border-indigo-400 focus:ring-0 transition-colors"
                                        placeholder="901234567"
                                        required
                                    />
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-gray-700 font-semibold mb-2">
                                    Parol {isEditAdminMode ? '(Bo\'sh qoldirish mumkin)' : '*'}
                                </label>
                                <input
                                    type="password"
                                    value={newAdmin.password}
                                    onChange={(e) => setNewAdmin({...newAdmin, password: e.target.value})}
                                    className="w-full border-2 border-gray-200 rounded-xl p-3 focus:border-indigo-400 focus:ring-0 transition-colors"
                                    placeholder="Parolni kiriting"
                                    required={!isEditAdminMode}
                                />
                            </div>
                            
                            <div>
                                <label className="block text-gray-700 font-semibold mb-2">Rol *</label>
                                <select
                                    value={newAdmin.role}
                                    onChange={(e) => {
                                        const role = e.target.value;
                                        const isSuperAdmin = role === 'super_admin';
                                        setNewAdmin({
                                            ...newAdmin, 
                                            role,
                                            permissions: isSuperAdmin ? {
                                                canAddProducts: true,
                                                canEditProducts: true,
                                                canDeleteProducts: true,
                                                canAddAdmins: true,
                                                canEditAdmins: true,
                                                canDeleteAdmins: true,
                                                canDeleteOrders: true,
                                                canViewOrders: true
                                            } : newAdmin.permissions
                                        });
                                    }}
                                    className="w-full border-2 border-gray-200 rounded-xl p-3 focus:border-indigo-400 focus:ring-0 transition-colors"
                                    required
                                >
                                    <option value="admin">Admin</option>
                                    <option value="super_admin">Super Admin (Barcha ruxsatlar)</option>
                                </select>
                            </div>
                            
                            {newAdmin.role !== 'super_admin' && (
                                <div className="border-2 border-gray-200 rounded-xl p-4 space-y-3">
                                    <label className="block text-gray-700 font-semibold mb-2">Ruxsatlar:</label>
                                    <div className="space-y-2">
                                        <label className="flex items-center space-x-3 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={newAdmin.permissions.canAddProducts}
                                                onChange={(e) => setNewAdmin({
                                                    ...newAdmin,
                                                    permissions: {...newAdmin.permissions, canAddProducts: e.target.checked}
                                                })}
                                                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                            />
                                            <span className="text-sm text-gray-700">Mahsulot qo'shish</span>
                                        </label>
                                        <label className="flex items-center space-x-3 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={newAdmin.permissions.canEditProducts}
                                                onChange={(e) => setNewAdmin({
                                                    ...newAdmin,
                                                    permissions: {...newAdmin.permissions, canEditProducts: e.target.checked}
                                                })}
                                                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                            />
                                            <span className="text-sm text-gray-700">Mahsulot tahrirlash</span>
                                        </label>
                                        <label className="flex items-center space-x-3 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={newAdmin.permissions.canDeleteProducts}
                                                onChange={(e) => setNewAdmin({
                                                    ...newAdmin,
                                                    permissions: {...newAdmin.permissions, canDeleteProducts: e.target.checked}
                                                })}
                                                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                            />
                                            <span className="text-sm text-gray-700">Mahsulot o'chirish</span>
                                        </label>
                                        <label className="flex items-center space-x-3 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={newAdmin.permissions.canAddAdmins}
                                                onChange={(e) => setNewAdmin({
                                                    ...newAdmin,
                                                    permissions: {...newAdmin.permissions, canAddAdmins: e.target.checked}
                                                })}
                                                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                            />
                                            <span className="text-sm text-gray-700">Admin qo'shish</span>
                                        </label>
                                        <label className="flex items-center space-x-3 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={newAdmin.permissions.canEditAdmins}
                                                onChange={(e) => setNewAdmin({
                                                    ...newAdmin,
                                                    permissions: {...newAdmin.permissions, canEditAdmins: e.target.checked}
                                                })}
                                                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                            />
                                            <span className="text-sm text-gray-700">Admin tahrirlash</span>
                                        </label>
                                        <label className="flex items-center space-x-3 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={newAdmin.permissions.canDeleteAdmins}
                                                onChange={(e) => setNewAdmin({
                                                    ...newAdmin,
                                                    permissions: {...newAdmin.permissions, canDeleteAdmins: e.target.checked}
                                                })}
                                                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                            />
                                            <span className="text-sm text-gray-700">Admin o'chirish</span>
                                        </label>
                                        <label className="flex items-center space-x-3 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={newAdmin.permissions.canDeleteOrders}
                                                onChange={(e) => setNewAdmin({
                                                    ...newAdmin,
                                                    permissions: {...newAdmin.permissions, canDeleteOrders: e.target.checked}
                                                })}
                                                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                            />
                                            <span className="text-sm text-gray-700">Buyurtma tarixini o'chirish</span>
                                        </label>
                                    </div>
                                </div>
                            )}
                            
                            <div className="flex justify-end space-x-3 pt-4">
                                <button
                                    type="button"
                                    onClick={closeAddAdminModal}
                                    className="px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
                                >
                                    Bekor qilish
                                </button>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-semibold rounded-xl transition-all duration-200 disabled:opacity-50"
                                >
                                    {isLoading ? 'Saqlanmoqda...' : isEditAdminMode ? 'Saqlash' : 'Admin qo\'shish'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

// Confirm Modal Component
const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, type = 'info' }) => {
    if (!isOpen) return null;

    const getIconAndColor = () => {
        switch (type) {
            case 'warning':
                return {
                    icon: (
                        <svg className="w-8 h-8 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                    ),
                    bgColor: 'bg-yellow-50',
                    borderColor: 'border-yellow-200',
                    buttonColor: 'bg-yellow-500 hover:bg-yellow-600'
                };
            case 'error':
                return {
                    icon: (
                        <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    ),
                    bgColor: 'bg-red-50',
                    borderColor: 'border-red-200',
                    buttonColor: 'bg-red-500 hover:bg-red-600'
                };
            case 'success':
                return {
                    icon: (
                        <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    ),
                    bgColor: 'bg-green-50',
                    borderColor: 'border-green-200',
                    buttonColor: 'bg-green-500 hover:bg-green-600'
                };
            default:
                return {
                    icon: (
                        <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    ),
                    bgColor: 'bg-blue-50',
                    borderColor: 'border-blue-200',
                    buttonColor: 'bg-blue-500 hover:bg-blue-600'
                };
        }
    };

    const { icon, bgColor, borderColor, buttonColor } = getIconAndColor();

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all duration-300 scale-100">
                <div className={`${bgColor} ${borderColor} border-2 p-6 rounded-t-2xl`}>
                    <div className="flex items-center space-x-3">
                        {icon}
                        <h3 className="text-xl font-bold text-gray-900">{title}</h3>
                    </div>
                </div>
                
                <div className="p-6">
                    <p className="text-gray-600 mb-6 leading-relaxed">{message}</p>
                    
                    <div className="flex space-x-3">
                        <button
                            onClick={onClose}
                            className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-colors"
                        >
                            Bekor qilish
                        </button>
                        <button
                            onClick={() => {
                                onConfirm();
                                onClose();
                            }}
                            className={`flex-1 ${buttonColor} text-white px-4 py-3 rounded-xl font-medium transition-colors`}
                        >
                            Tasdiqlash
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Success Modal Component
const SuccessModal = ({ isOpen, onClose, title, message }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all duration-300 scale-100">
                <div className="bg-green-50 border-2 border-green-200 p-6 rounded-t-2xl">
                    <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900">{title}</h3>
                    </div>
                </div>
                
                <div className="p-6">
                    <p className="text-gray-600 mb-6 leading-relaxed">{message}</p>
                    
                    <button
                        onClick={onClose}
                        className="w-full bg-green-500 hover:bg-green-600 text-white px-4 py-3 rounded-xl font-medium transition-colors"
                    >
                        Yaxshi
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AdminPanel; 