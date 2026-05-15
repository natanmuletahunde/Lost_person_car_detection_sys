const TelegramBot = require('node-telegram-bot-api');
const User = require('./models/User');
// const AuditLog = require('./models/AuditLog'); // Uncomment if you have it

const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token) {
  throw new Error('❌ TELEGRAM_BOT_TOKEN is missing in .env');
}

// Initialize bot
const bot = new TelegramBot(token, { polling: true });

console.log('🤖 Telegram bot started successfully...');

// ==============================
// MESSAGE HANDLER
// ==============================
bot.on('message', async (msg) => {
  try {
    const chatId = msg.chat.id;
    const text = msg.text?.trim();

    // START COMMAND
    if (text === '/start') {
      return bot.sendMessage(
        chatId,
        '👋 Welcome to the Missing Person Alert System!\n\n' +
        'Send your registered email to link your account and start receiving real-time alerts with exact location.'
      );
    }

    // HELP COMMAND
    if (text === '/help') {
      return bot.sendMessage(
        chatId,
        '📋 Available Commands:\n\n' +
        '/start - Start the bot\n' +
        '/help - Show this help message\n' +
        '/status - Check your account status\n\n' +
        'Just send your registered email to link your account.'
      );
    }

    // EMAIL LINKING
    const isEmail = /\S+@\S+\.\S+/.test(text);
    if (isEmail) {
      const email = text.toLowerCase().trim();
      const user = await User.findOne({ email });

      if (!user) {
        return bot.sendMessage(
          chatId,
          '❌ No account found with this email.\nPlease register first on the web portal.'
        );
      }

      // Already linked
      if (user.telegramChatId === chatId) {
        return bot.sendMessage(
          chatId,
          '✅ Your account is already linked to this Telegram.'
        );
      }

      // Link the account
      user.telegramChatId = chatId;
      await user.save();

      return bot.sendMessage(
        chatId,
        '✅ Account linked successfully!\n\n' +
        'You will now receive real-time missing person detection alerts with exact location 📍'
      );
    }

    // DEFAULT RESPONSE
    return bot.sendMessage(
      chatId,
      '📩 Please send your registered email to link your account.\n\n' +
      'Type /help for available commands.'
    );

  } catch (error) {
    console.error('❌ Telegram Bot Error:', error.message);
    // Send friendly error to user
    bot.sendMessage(chatId, '⚠️ Something went wrong. Please try again later.');
  }
});

// Optional: Add /status command handler
bot.onText(/\/status/, async (msg) => {
  const chatId = msg.chat.id;
  try {
    const user = await User.findOne({ telegramChatId: chatId });
    if (user) {
      bot.sendMessage(chatId, `✅ You are linked successfully.\nEmail: ${user.email}`);
    } else {
      bot.sendMessage(chatId, '❌ You have not linked any account yet.\nSend your email to link.');
    }
  } catch (err) {
    bot.sendMessage(chatId, '⚠️ Error checking status.');
  }
});

module.exports = bot;