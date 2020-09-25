const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs')

module.exports = {
    Telegram: class {
        constructor() {
            this.telegramToken = process.env.TELEGRAM_TOKEN
            this.isTokenSet = this.telegramToken != null
            if (this.telegramToken == null)
                console.log("🛑 Environment variable TELEGRAM_TOKEN not set. Won't enable Telegram integration.")
            else {
                console.log("🔁 Initializing Telegram Bot...")
                this.telegramBot = new TelegramBot(this.telegramToken, {polling: true});

                this.telegramBot.on('message', async (msg) => {
                    const text = msg.text
                    if (text !== "/listen-eaic") return

                    const chatId = msg.chat.id;
                    const user = msg.from

                    const readListeners =
                        fs.existsSync('.listeners.json') ?
                            fs.readFileSync('.listeners.json', 'utf8') :
                            '[]'
                    const listeners = JSON.parse(readListeners)
                    listeners.push(chatId)

                    fs.writeFileSync('.listeners.json', JSON.stringify(listeners))

                    await this.telegramBot.sendMessage(chatId, `✅ Added you to the listeners for EAIC`)
                });
                console.log("✅ Telegram Bot ready!")
            }
        }

        async sendMessage(message){
            const readListeners =
                fs.existsSync('.listeners.json') ?
                    fs.readFileSync('.listeners.json', 'utf8') :
                    '[]'
            const listeners = JSON.parse(readListeners)

            for (const l in listeners)
                if (listeners.hasOwnProperty(l))
                    await this.telegramBot.sendMessage(listeners[l], message)
        }
    }
}