const TelegramBot = require('node-telegram-bot-api');
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, onSnapshot } = require('firebase/firestore');

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

// Bot token
const BOT_TOKEN = '8084493413:AAHaVfnOzuTossr356qshmQtWtsEetLioRA';

// Bot yaratish
const bot = new TelegramBot(BOT_TOKEN, { polling: true });

// Admin chat ID (bu yerga o'z Telegram ID ngizni qo'ying)
// Botga /start yuborsangiz, console da sizning chat ID chiqadi
let ADMIN_CHAT_ID = null;

console.log('🤖 Umar Perfume Telegram Bot ishga tushdi...');

// /start buyrug'i
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const userName = msg.from.first_name || 'Foydalanuvchi';
    
    console.log(`📱 Yangi foydalanuvchi: ${userName} (Chat ID: ${chatId})`);
    
    // Agar admin chat ID o'rnatilmagan bo'lsa, birinchi foydalanuvchini admin qilib belgilaymiz
    if (!ADMIN_CHAT_ID) {
        ADMIN_CHAT_ID = chatId;
        console.log(`👑 Admin chat ID o'rnatildi: ${chatId}`);
    }
    
    const welcomeMessage = `
🌟 *Umar Perfume Bot*ga xush kelibsiz!

Salom, ${userName}! 👋

Ushbu bot orqali siz:
• 🛍️ Yangi buyurtmalar haqida xabar olasiz
• 📊 Buyurtmalar statistikasini ko'rasiz
• ⚡ Real vaqtda yangilanishlarni olasiz

Bot muvaffaqiyatli ishga tushdi! ✅
    `;
    
    bot.sendMessage(chatId, welcomeMessage, { parse_mode: 'Markdown' });
});

// /help buyrug'i
bot.onText(/\/help/, (msg) => {
    const chatId = msg.chat.id;
    
    const helpMessage = `
📖 *Bot buyruqlari:*

/start - Botni ishga tushirish
/help - Yordam
/status - Bot holati
/stats - Buyurtmalar statistikasi

🔔 *Avtomatik xabarlar:*
• Yangi buyurtma kelganda xabar olasiz
• Buyurtma holati o'zgarganda bildirishnoma keladi

❓ Savollaringiz bo'lsa, admin bilan bog'laning.
    `;
    
    bot.sendMessage(chatId, helpMessage, { parse_mode: 'Markdown' });
});

// /status buyrug'i
bot.onText(/\/status/, (msg) => {
    const chatId = msg.chat.id;
    
    const statusMessage = `
✅ *Bot holati: Aktiv*

🤖 Bot versiyasi: 1.0.0
📅 Ishga tushgan vaqt: ${new Date().toLocaleString('uz-UZ')}
🔗 Firebase: Ulangan
📡 Telegram API: Ishlayapti

Bot to'liq ishlamoqda! 🚀
    `;
    
    bot.sendMessage(chatId, statusMessage, { parse_mode: 'Markdown' });
});

// Yangi buyurtma haqida xabar yuborish funksiyasi
function sendNewOrderNotification(order) {
    if (!ADMIN_CHAT_ID) {
        console.log('⚠️ Admin chat ID o\'rnatilmagan!');
        return;
    }
    
    const customerName = order.customerInfo ? 
        `${order.customerInfo.firstName} ${order.customerInfo.lastName}` : 
        'Noma\'lum mijoz';
    
    const phoneNumber = order.customerInfo ? 
        order.customerInfo.phoneNumber : 
        'Telefon raqam yo\'q';
    
    const message = `
🛍️ *YANGI BUYURTMA!*

👤 *Mijoz:* ${customerName}
📞 *Telefon:* ${phoneNumber}
🎁 *Mahsulot:* ${order.productName || 'N/A'}
📏 *O'lcham:* ${order.size || 'N/A'}
🔢 *Miqdor:* ${order.quantity || 1}
💰 *Narx:* ${order.totalPrice ? order.totalPrice.toLocaleString() : 0} so'm
⏰ *Vaqt:* ${new Date(order.createdAt).toLocaleString('uz-UZ')}

🔔 Admin panelda ko'ring va javob bering!
    `;
    
    bot.sendMessage(ADMIN_CHAT_ID, message, { parse_mode: 'Markdown' })
        .then(() => {
            console.log('✅ Yangi buyurtma haqida xabar yuborildi');
        })
        .catch((error) => {
            console.error('❌ Xabar yuborishda xatolik:', error);
        });
}

// Mahsulot soni 3 dan kam bo'lganda ogohlantirish funksiyasi
function sendLowStockNotification(product) {
    if (!ADMIN_CHAT_ID) {
        console.log('⚠️ Admin chat ID o\'rnatilmagan!');
        return;
    }
    
    // Mahsulot o'lchamlarini tekshirish
    const sizes = product.sizes || [];
    const lowStockSizes = [];
    
    sizes.forEach(size => {
        const stock = typeof size.stock === 'number' ? size.stock : parseInt(size.stock || 0);
        if (stock < 3 && stock > 0) {
            lowStockSizes.push({
                size: size.size,
                stock: stock
            });
        }
    });
    
    // Agar umumiy soni 3 dan kam bo'lsa
    const totalStock = product.stock || (product.sizes ? 
        product.sizes.reduce((sum, s) => sum + (typeof s.stock === 'number' ? s.stock : parseInt(s.stock || 0)), 0) : 0);
    
    if (lowStockSizes.length > 0 || totalStock < 3) {
        let message = `⚠️ *MAHSULOT SONI KAM!*\n\n`;
        message += `🏷️ *Brand:* ${product.brand || 'N/A'}\n`;
        message += `📦 *Mahsulot:* ${product.name || 'N/A'}\n\n`;
        
        if (lowStockSizes.length > 0) {
            message += `📏 *O'lchamlar bo'yicha:*\n`;
            lowStockSizes.forEach(item => {
                message += `• ${item.size}: ${item.stock} dona qolgan\n`;
            });
        }
        
        if (totalStock < 3 && totalStock > 0) {
            message += `\n📊 *Jami soni:* ${totalStock} dona qolgan\n`;
        }
        
        message += `\n🔔 Zaxira qo'shish kerak!`;
        
        bot.sendMessage(ADMIN_CHAT_ID, message, { parse_mode: 'Markdown' })
            .then(() => {
                console.log(`✅ Mahsulot soni kam bo'lgani haqida xabar yuborildi: ${product.name}`);
            })
            .catch((error) => {
                console.error('❌ Xabar yuborishda xatolik:', error);
            });
    }
}

// Firebase dan buyurtmalarni kuzatish
let isListening = false;

// Oxirgi buyurtma vaqtini saqlash
let lastOrderTimestamp = null;
let isInitialLoad = true;

function startListeningToOrders() {
    if (isListening) {
        console.log('⚠️ Buyurtmalar allaqachon kuzatilmoqda...');
        return;
    }
    
    if (!ADMIN_CHAT_ID) {
        console.log('⚠️ Admin chat ID o\'rnatilmagan. /start buyrug\'ini bosing.');
        return;
    }
    
    console.log('👂 Buyurtmalarni kuzatish boshlandi...');
    
    const ordersRef = collection(db, 'orders');
    
    onSnapshot(ordersRef, (snapshot) => {
        // Birinchi yuklashda barcha buyurtmalarni olish va oxirgi vaqtni saqlash
        if (isInitialLoad) {
            if (snapshot.docs.length > 0) {
                const latestOrder = snapshot.docs
                    .map(doc => {
                        const data = doc.data();
                        return {
                            id: doc.id,
                            createdAt: data.createdAt ? new Date(data.createdAt).getTime() : 0
                        };
                    })
                    .sort((a, b) => b.createdAt - a.createdAt)[0];
                
                if (latestOrder && latestOrder.createdAt) {
                    lastOrderTimestamp = latestOrder.createdAt;
                    console.log('📅 Oxirgi buyurtma vaqti o\'rnatildi:', new Date(lastOrderTimestamp).toLocaleString('uz-UZ'));
                } else {
                    lastOrderTimestamp = Date.now();
                }
            } else {
                lastOrderTimestamp = Date.now();
            }
            isInitialLoad = false;
            console.log('✅ Birinchi yuklash yakunlandi. Endi yangi buyurtmalar kuzatiladi.');
            return; // Birinchi yuklashda xabar yubormaslik
        }
        
        // Keyingi o'zgarishlarni kuzatish
        snapshot.docChanges().forEach((change) => {
            if (change.type === 'added') {
                const order = { id: change.doc.id, ...change.doc.data() };
                const orderTime = order.createdAt ? new Date(order.createdAt).getTime() : Date.now();
                
                console.log('🆕 Yangi buyurtma topildi:', order.id, 'Vaqt:', new Date(orderTime).toLocaleString('uz-UZ'));
                
                // Faqat oxirgi vaqtdan keyin yaratilgan buyurtmalarni yuborish
                if (orderTime > lastOrderTimestamp) {
                    console.log('📤 Buyurtma xabari yuborilmoqda...');
                    sendNewOrderNotification(order);
                    lastOrderTimestamp = Math.max(lastOrderTimestamp, orderTime);
                } else {
                    console.log('⏭️ Bu buyurtma eski, xabar yuborilmaydi.');
                }
            }
        });
    }, (error) => {
        console.error('❌ Buyurtmalarni kuzatishda xatolik:', error);
        isListening = false; // Xatolik bo'lsa, qayta urinish uchun flag'ni o'chirish
    });
    
    isListening = true;
}

// Firebase dan mahsulotlarni kuzatish
let isProductsListening = false;

function startListeningToProducts() {
    if (isProductsListening) return;
    
    console.log('👂 Mahsulotlarni kuzatish boshlandi...');
    
    const productsRef = collection(db, 'products');
    
    onSnapshot(productsRef, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
            if (change.type === 'modified') {
                const product = { id: change.doc.id, ...change.doc.data() };
                console.log('📦 Mahsulot yangilandi:', product.id);
                
                // Mahsulot sonini tekshirish
                sendLowStockNotification(product);
            } else if (change.type === 'added') {
                const product = { id: change.doc.id, ...change.doc.data() };
                console.log('📦 Yangi mahsulot qo\'shildi:', product.id);
                
                // Yangi mahsulot sonini ham tekshirish
                sendLowStockNotification(product);
            }
        });
    }, (error) => {
        console.error('❌ Mahsulotlarni kuzatishda xatolik:', error);
    });
    
    isProductsListening = true;
}

// Bot ishga tushgandan 5 sekund keyin kuzatishni boshlash
setTimeout(() => {
    startListeningToOrders();
    startListeningToProducts();
}, 5000);

// Xatoliklarni tutish
bot.on('error', (error) => {
    console.error('❌ Bot xatolik:', error);
});

bot.on('polling_error', (error) => {
    console.error('❌ Polling xatolik:', error);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('🛑 Bot to\'xtatilmoqda...');
    bot.stopPolling();
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('🛑 Bot to\'xtatilmoqda...');
    bot.stopPolling();
    process.exit(0);
}); 