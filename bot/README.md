# 🤖 Umar Perfume Telegram Bot

Bu Telegram bot Umar Perfume onlayn do'koni uchun yaratilgan bo'lib, yangi buyurtmalar haqida real vaqtda xabar beradi.

## ✨ Xususiyatlar

- 🛍️ **Yangi buyurtma bildirishnomalari** - Har bir yangi buyurtma haqida darhol xabar olasiz
- 📊 **Real vaqt kuzatuvi** - Firebase orqali buyurtmalarni real vaqtda kuzatadi
- 🔔 **Avtomatik xabarlar** - Mijoz ma'lumotlari va buyurtma tafsilotlari bilan
- 🌐 **Ko'p tilli** - O'zbek va Rus tillarida

## 🚀 Ishga tushirish

### 1. Bog'liqliklarni o'rnatish
```bash
npm install
```

### 2. Botni ishga tushirish
```bash
npm start
# yoki
npm run dev
```

### 3. Bot bilan ishlash
1. Telegram da `@YourBotName` ni toping
2. `/start` buyrug'ini yuboring
3. Birinchi foydalanuvchi avtomatik admin bo'ladi

## 📋 Bot buyruqlari

- `/start` - Botni ishga tushirish va admin sifatida ro'yxatdan o'tish
- `/help` - Yordam va buyruqlar ro'yxati
- `/status` - Bot holati haqida ma'lumot
- `/stats` - Buyurtmalar statistikasi

## ⚙️ Sozlamalar

### Bot Token
`index.js` faylida bot tokeningizni o'rnating:
```javascript
const BOT_TOKEN = 'YOUR_BOT_TOKEN_HERE';
```

### Firebase
Firebase konfiguratsiyasi allaqachon o'rnatilgan, lekin kerak bo'lsa `firebaseConfig` ni yangilashingiz mumkin.

## 🔔 Xabar formati

Yangi buyurtma kelganda bot quyidagi formatda xabar yuboradi:

```
🛍️ YANGI BUYURTMA!

👤 Mijoz: Ism Familiya
📞 Telefon: +998901234567
🎁 Mahsulot: Mahsulot nomi
📏 O'lcham: 50ml
🔢 Miqdor: 1
💰 Narx: 150,000 so'm
⏰ Vaqt: 22.09.2025, 17:30

🔔 Admin panelda ko'ring va javob bering!
```

## 🛠️ Texnik ma'lumotlar

- **Node.js** - Runtime muhit
- **node-telegram-bot-api** - Telegram Bot API
- **Firebase** - Ma'lumotlar bazasi va real vaqt kuzatuvi
- **Real-time listeners** - Yangi buyurtmalarni darhol aniqlash

## 📝 Log'lar

Bot quyidagi log'larni chiqaradi:
- ✅ Muvaffaqiyatli amallar
- ❌ Xatoliklar
- 📱 Yangi foydalanuvchilar
- 🆕 Yangi buyurtmalar

## 🔧 Muammolarni hal qilish

### Bot javob bermayapti
1. Internet aloqasini tekshiring
2. Bot tokenini tekshiring
3. Firebase ulanishini tekshiring

### Xabarlar kelmayapti
1. Admin chat ID to'g'ri o'rnatilganini tekshiring
2. Firebase permissions ni tekshiring
3. Bot log'larini ko'ring

## 📞 Qo'llab-quvvatlash

Muammolar yoki savollar bo'lsa, admin bilan bog'laning.

---

**Umar Perfume** - Eng yaxshi atirlar! 🌟 