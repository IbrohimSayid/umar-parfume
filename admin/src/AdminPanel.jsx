import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, setDoc, updateDoc } from 'firebase/firestore';
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

const AdminPanel = () => {
    const [activeTab, setActiveTab] = useState('users');
    const [users, setUsers] = useState([]);
    const [orders, setOrders] = useState([]);
    const [products, setProducts] = useState([]);
    const [showProductModal, setShowProductModal] = useState(false);
    const [showAdminModal, setShowAdminModal] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    
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
        sizes: [{ size: '', price: '', stock: '', image: null }]
    });
    
    // Notalar ro'yxati
    const [availableNotes, setAvailableNotes] = useState([
        'Sitrus mevalar', 'Darx notalari', 'Gul notalari', 'Yog&apos;och notalari',
        'Musk', 'Vanila', 'Bergamot', 'Jasmin', 'Sandalwood', 'Patchouli',
        'Lavanda', 'Mint', 'Qora murch', 'Amber', 'Oud', 'Limon'
    ]);
    const [showNotesSettings, setShowNotesSettings] = useState(false);
    const [newNote, setNewNote] = useState('');
    
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
        role: 'admin'
    });
    const [editingAdmin, setEditingAdmin] = useState(null);
    const [isEditAdminMode, setIsEditAdminMode] = useState(false);

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

    // Component yuklanganida ma'lumotlarni olish
    useEffect(() => {
        if (isLoggedIn) {
            fetchProducts();
            fetchUsers();
            fetchOrders();
            if (adminInfo.role === 'super_admin') {
                fetchAdmins();
            }
        }
    }, [isLoggedIn]);

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
            showSuccessModal('Muvaffaqiyat!', 'Admin panelga muvaffaqiyatli kirdingiz!');
        } else {
            showConfirmModal(
                'Xatolik!', 
                'Kiritilgan ma\'lumotlar noto\'g\'ri. Iltimos, qayta urinib ko\'ring.',
                () => {},
                'error'
            );
        }
    };

    const handleAdminUpdate = (e) => {
        e.preventDefault();
        setShowAdminModal(false);
        showSuccessModal('Muvaffaqiyat!', 'Admin ma\'lumotlari muvaffaqiyatli yangilandi!');
    };

    const addNewSize = () => {
        setNewProduct({
            ...newProduct,
            sizes: [...newProduct.sizes, { size: '', price: '', stock: '', image: null }]
        });
    };

    const updateSize = (index, field, value) => {
        const updatedSizes = newProduct.sizes.map((size, i) => 
            i === index ? { ...size, [field]: value } : size
        );
        setNewProduct({ ...newProduct, sizes: updatedSizes });
    };

    const removeSize = (index) => {
        if (newProduct.sizes.length > 1) {
            const updatedSizes = newProduct.sizes.filter((_, i) => i !== index);
            setNewProduct({ ...newProduct, sizes: updatedSizes });
        }
    };

    // Nota qo'shish/o'chirish
    const addNote = () => {
        if (newNote.trim() && !availableNotes.includes(newNote.trim())) {
            setAvailableNotes([...availableNotes, newNote.trim()]);
            setNewNote('');
        }
    };

    const removeNote = (note) => {
        setAvailableNotes(availableNotes.filter(n => n !== note));
        setNewProduct({
            ...newProduct,
            fragranceNotes: newProduct.fragranceNotes.filter(n => n !== note)
        });
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
            // Sizes arrayidagi File obyektlarini tekshirish va tozalash
            const cleanedSizes = newProduct.sizes.map(size => ({
                size: size.size,
                price: size.price,
                stock: size.stock, // Stockni ham tozalash
                // File obyektini o'chirish, faqat matn ma'lumotlarini saqlash
                imageName: size.image ? size.image.name : null
            }));

            // Umumiy stockni o'lchamlar bo'yicha hisoblash
            const totalStock = cleanedSizes.reduce((sum, size) => {
                return sum + (parseInt(size.stock) || 0);
            }, 0);

        const product = {
                            name: newProduct.name,
                brand: newProduct.brand,
                price: newProduct.price,
                stock: totalStock, // O'lchamlar sonidan hisoblangan
                status: totalStock > 0 ? 'mavjud' : 'mavjud emas',
                image: `https://images.unsplash.com/photo-1541643600914-78b084683601?w=300&h=400&fit=crop&random=${Date.now()}`,
                description: newProduct.description,
                category: newProduct.category,
                fragrance_notes: newProduct.fragranceNotes,
                sizes: cleanedSizes, // Tozalangan sizes
                createdAt: new Date().toISOString()
            };
            
            // Firestore'ga saqlash
            const docRef = await addDoc(collection(db, "products"), product);
            console.log('✅ Mahsulot Firestore ga saqlandi, ID:', docRef.id);
            
            // Admin amalini log qilish
            await logAdminAction(
                'CREATE_PRODUCT',
                `Yangi mahsulot qo'shildi: ${product.name} (${product.brand})`,
                'product',
                docRef.id
            );
            
            // State ni yangilash
            setProducts([...products, { id: docRef.id, ...product }]);
            
                        // Formani tozalash
            setNewProduct({
                name: '',
                brand: '',
                price: '',
                description: '',
                category: 'erkak',
                fragranceNotes: [],
                sizes: [{ size: '', price: '', stock: '', image: null }]
            });
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
            sizes: product.sizes || [{ size: '', price: '', stock: '', image: null }]
        });
        
        setShowProductModal(true);
    };

    // Mahsulotni yangilash
    const handleProductUpdate = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        
        try {
            // Sizes arrayidagi File obyektlarini tekshirish va tozalash
            const cleanedSizes = newProduct.sizes.map(size => ({
                size: size.size,
                price: size.price,
                stock: size.stock,
                imageName: size.image ? size.image.name : null
            }));

            // Umumiy stockni o'lchamlar bo'yicha hisoblash
            const totalStock = cleanedSizes.reduce((sum, size) => {
                return sum + (parseInt(size.stock) || 0);
            }, 0);

            const updatedProduct = {
                name: newProduct.name,
                brand: newProduct.brand,
                price: newProduct.price,
                stock: totalStock, // O'lchamlar sonidan hisoblangan
                status: totalStock > 0 ? 'mavjud' : 'mavjud emas',
                image: editingProduct.image, // Eski rasmni saqlash
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
            sizes: [{ size: '', price: '', stock: '', image: null }]
        });
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
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-lg border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
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
                                onClick={() => setIsLoggedIn(false)}
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
                    <div className="flex space-x-8">
                        {[
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
                            {orders.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mijoz</th>
                                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Telefon</th>
                                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mahsulot</th>
                                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Narx</th>
                                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amallar</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {orders.map(order => (
                                                <tr key={order.id} className="hover:bg-gray-50 transition-colors">
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
                    <div className="flex items-center space-x-4">
                        <div className="bg-gradient-to-r from-purple-50 to-pink-50 px-4 py-2 rounded-xl">
                            <span className="text-purple-600 font-semibold">Jami: {products.length}</span>
                        </div>
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
                                <label className="block text-gray-700 font-semibold mb-2">Mahsulot rasmi</label>
                                <input 
                                    type="file" 
                                    accept="image/*"
                                    className="w-full border-2 border-dashed border-gray-300 rounded-xl p-4 text-center hover:border-yellow-400 transition-colors cursor-pointer"
                                />
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
                                <input
                                    type="text"
                                    value={newProduct.brand}
                                    onChange={(e) => setNewProduct({...newProduct, brand: e.target.value})}
                                    className="w-full border-2 border-gray-200 rounded-xl p-3 focus:border-yellow-400 focus:ring-0 transition-colors"
                                    placeholder="Masalan: Chanel"
                                    required
                                />
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
                            <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                <svg className="w-6 h-6 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17v4a2 2 0 002 2h4M13 5v4a2 2 0 002 2h4" />
                                </svg>
                                O&apos;lchamlar va narxlar
                            </h4>
                            <div className="space-y-4">
                                {newProduct.sizes.map((size, index) => (
                                    <div 
                                        key={index} 
                                        className="bg-gray-50 p-4 rounded-xl border-2 border-gray-100 hover:border-gray-200 transition-colors"
                                    >
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-sm font-medium text-gray-700">O&apos;lcham {index + 1}</span>
                                            {newProduct.sizes.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => removeSize(index)}
                                                    className="text-red-500 hover:text-red-700 text-sm font-medium"
                                                >
                                                    O&apos;chirish
                                                </button>
                                            )}
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                                            <input
                                                type="text"
                                                value={size.size}
                                                onChange={(e) => updateSize(index, 'size', e.target.value)}
                                                className="border-2 border-gray-200 rounded-lg p-2 focus:border-blue-400 focus:ring-0 transition-colors"
                                                placeholder="Hajm (ml)"
                                            />
                                            <input
                                                type="text"
                                                value={size.price}
                                                onChange={(e) => updateSize(index, 'price', e.target.value)}
                                                className="border-2 border-gray-200 rounded-lg p-2 focus:border-blue-400 focus:ring-0 transition-colors"
                                                placeholder="Narx"
                                            />
                                            <input
                                                type="text"
                                                value={size.stock}
                                                onChange={(e) => updateSize(index, 'stock', e.target.value)}
                                                className="border-2 border-gray-200 rounded-lg p-2 focus:border-blue-400 focus:ring-0 transition-colors"
                                                placeholder="Soni"
                                            />
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => updateSize(index, 'image', e.target.files[0])}
                                                className="border-2 border-gray-200 rounded-lg p-2 text-sm cursor-pointer"
                                            />
                                        </div>
                                    </div>
                                ))}
                                <button
                                    type="button"
                                    onClick={addNewSize}
                                    className="w-full border-2 border-dashed border-blue-300 text-blue-600 hover:border-blue-400 hover:text-blue-700 py-3 rounded-xl transition-colors flex items-center justify-center font-medium"
                                >
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                    </svg>
                                    Yana o&apos;lcham qo&apos;shish
                                </button>
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
                                    {isLoading ? 'Saqlanmoqda...&apos;' : isEditMode ? 'Mahsulotni saqlash&apos;' : 'Mahsulotni saqlash&apos;}
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
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
                        <div className="p-6 border-b border-gray-200">
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
                        
                        <form onSubmit={isEditAdminMode ? updateAdmin : addAdmin} className="p-6 space-y-4">
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
                                    onChange={(e) => setNewAdmin({...newAdmin, role: e.target.value})}
                                    className="w-full border-2 border-gray-200 rounded-xl p-3 focus:border-indigo-400 focus:ring-0 transition-colors"
                                    required
                                >
                                    <option value="admin">Admin</option>
                                    <option value="super_admin">Super Admin</option>
                                </select>
                            </div>
                            
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
            
            setNewAdmin({
                firstName: '',
                lastName: '',
                phone: '',
                password: '',
                role: 'admin'
            });
            
            setShowAddAdminModal(false);
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
            role: admin.role || 'admin'
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
            
            setNewAdmin({
                firstName: '',
                lastName: '',
                phone: '',
                password: '',
                role: 'admin'
            });
            
            setShowAddAdminModal(false);
            setIsEditAdminMode(false);
            setEditingAdmin(null);
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

    const closeAddAdminModal = () => {
        setShowAddAdminModal(false);
        setIsEditAdminMode(false);
        setEditingAdmin(null);
        setNewAdmin({
            firstName: '',
            lastName: '',
            phone: '',
            password: '',
            role: 'admin'
        });
    };

export default AdminPanel; 