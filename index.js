const { Telegraf } = require('telegraf');
const admin = require('firebase-admin');
require('dotenv').config(); // Loads your local .env file

// 1. Initialize Firebase using the secure JSON file
const serviceAccount = require('./firebase-credentials.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
const db = admin.firestore();

// 2. Initialize Telegram using the secure Environment Variable
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

// 3. The Bot Logic
bot.on('text', async (ctx) => {
  const text = ctx.message.text; 
  
  try {
    // Basic parser expecting "500 food"
    const parts = text.split(' ');
    const amt = parseFloat(parts[0]);
    const cat = parts[1] || 'other';

    if (isNaN(amt)) {
      return ctx.reply("❌ Format error. Please send: 'Amount Category' (e.g. '500 food')");
    }

    const newTxn = {
      name: "Added via Telegram",
      amt: amt,
      cat: cat.toLowerCase(),
      date: new Date().toISOString().split("T")[0],
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute:'2-digit' }),
      upi: "Cash",
      reason: text
    };

    // 🔴 CHANGE 'your_username' TO YOUR ACTUAL FIREBASE DOCUMENT ID
    const userRef = db.collection('users').doc('your_username'); 
    
    await userRef.update({
      transactions: admin.firestore.FieldValue.arrayUnion(newTxn)
    });

    ctx.reply(`✅ Logged ₹${amt} to ${cat}!`);

  } catch (error) {
    console.error("Save error:", error);
    ctx.reply("❌ Error connecting to the database.");
  }
});

// 4. Export as a Webhook Cloud Function
exports.telegramBot = functions.https.onRequest(async (req, res) => {
  try {
    await bot.handleUpdate(req.body, res); 
  } catch (err) {
    console.error("Webhook Error:", err);
    res.sendStatus(500);
  }
});