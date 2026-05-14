const { Telegraf } = require("telegraf");
const admin = require("firebase-admin");
const express = require("express");
require("dotenv").config();

// 1. Initialize Firebase
const serviceAccount = require("./firebase-credentials.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
const db = admin.firestore();

// 2. Initialize Telegram Bot
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

// 3. Bot Logic
bot.on('text', async (ctx) => {
  const text = ctx.message.text; 
  
  try {
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
    const userRef = db.collection('users').doc('admin'); 
    
    await userRef.update({
      transactions: admin.firestore.FieldValue.arrayUnion(newTxn)
    });

    ctx.reply(`✅ Logged ₹${amt} to ${cat}!`);

  } catch (error) {
    console.error("Save error:", error);
    ctx.reply("❌ Error connecting to the database.");
  }
});

// 4. Start the Bot (Polling Mode)
bot.launch();
console.log("🤖 Telegram bot is polling...");

// Dummy Web Server for Render
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('Bot is running safely on Render!');
});

app.listen(PORT, () => {
  console.log(`Web server listening on port ${PORT}`);
});