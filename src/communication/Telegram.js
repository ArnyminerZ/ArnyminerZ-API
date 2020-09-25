const TelegramBot = require('node-telegram-bot-api');

module.exports = class Telegram {
    constructor() {
        this.telegramToken = process.env.TELEGRAM_TOKEN
        this.isTokenSet = this.telegramToken != null
        if (this.telegramToken == null)
            console.log("🛑 Environment variable TELEGRAM_TOKEN not set. Won't enable Telegram integration.")
        else {
            console.log("🔁 Initializing Telegram Bot...")
            this.telegramBot = new TelegramBot(this.telegramToken, {polling: true});

            this.telegramBot.onText(/\/echo (.+)/, (msg, match) => {
                // 'msg' is the received Message from Telegram
                // 'match' is the result of executing the regexp above on the text content
                // of the message

                const chatId = msg.chat.id;
                const resp = match[1]; // the captured "whatever"

                // send back the matched "whatever" to the chat
                this.telegramBot.sendMessage(chatId, resp);
            });

            this.telegramBot.on('message', (msg) => {
                const chatId = msg.chat.id;

                // send a message to the chat acknowledging receipt of their message
                this.telegramBot.sendMessage(chatId, 'Received your message');
            });
        }
    }
}