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

// Firebase dan buyurtmalarni kuzatish
let isListening = false;

function startListeningToOrders() {
    if (isListening) return;
    
    console.log('👂 Buyurtmalarni kuzatish boshlandi...');
    
    const ordersRef = collection(db, 'orders');
    
    onSnapshot(ordersRef, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
            if (change.type === 'added') {
                const order = { id: change.doc.id, ...change.doc.data() };
                console.log('🆕 Yangi buyurtma topildi:', order.id);
                
                // Faqat yangi buyurtmalarni yuborish (5 daqiqadan kamroq)
                const orderTime = new Date(order.createdAt);
                const now = new Date();
                const diffMinutes = (now - orderTime) / (1000 * 60);
                
                if (diffMinutes < 5) {
                    sendNewOrderNotification(order);
                }
            }
        });
    }, (error) => {
        console.error('❌ Buyurtmalarni kuzatishda xatolik:', error);
    });
    
    isListening = true;
}

// Bot ishga tushgandan 5 sekund keyin kuzatishni boshlash
setTimeout(() => {
    startListeningToOrders();
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