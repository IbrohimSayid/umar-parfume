import { NextResponse } from 'next/server';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID || process.env.ADMIN_CHAT_ID;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { productId, productName, name, phone, message } = body || {};

    if (!productId || !productName || !message) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!BOT_TOKEN || !CHAT_ID) {
      return NextResponse.json(
        { success: false, message: 'Telegram credentials are missing' },
        { status: 500 }
      );
    }

    const composedMessage = [
      '📦 *Talab so\'rovi*',
      '',
      `🛍️ *Mahsulot:* ${productName}`,
      `🆔 *ID:* ${productId}`,
      name ? `👤 *Ism:* ${name}` : '',
      phone ? `📞 *Telefon:* ${phone}` : '',
      '',
      `💬 *Xabar:*`,
      message
    ]
      .filter(Boolean)
      .join('\n');

    const telegramResponse = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: composedMessage,
        parse_mode: 'Markdown'
      })
    });

    if (!telegramResponse.ok) {
      const errorData = await telegramResponse.json();
      throw new Error(errorData.description || 'Telegram API error');
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Restock request error:', error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

