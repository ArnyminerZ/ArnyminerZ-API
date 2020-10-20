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
                    const chatId = msg.chat.id;
                    const user = msg.from
                    if (text === "/listen-eaic") {
                        const readListeners =
                            fs.existsSync('.listeners.json') ?
                                fs.readFileSync('.listeners.json', 'utf8') :
                                '[]'
                        const listeners = JSON.parse(readListeners)
                        listeners.push(chatId)

                        fs.writeFileSync('.listeners.json', JSON.stringify(listeners))

                        await this.telegramBot.sendMessage(chatId, `✅ Added you to the listeners for ArnyminerZ API`)
                    } else if (text === '/environment') {
                        const msg = "ℹ **Environment variables:**\n" +
                            "- TOKEN_EXPIRATION_TIME: " + process.env.TOKEN_EXPIRATION_TIME + '\n' +
                            "- TOKEN_LONG_MULTIPLIER: " + process.env.TOKEN_LONG_MULTIPLIER + '\n' +
                            "- TOKEN_STORAGE_EFFICIENT: " + process.env.TOKEN_STORAGE_EFFICIENT + '\n' +
                            "- TOKENS_PATH: " + process.env.TOKENS_PATH + '\n\n' +
                            "- MAX_PEOPLE_PER_BOOKING: " + process.env.MAX_PEOPLE_PER_BOOKING + '\n\n' +
                            "- SMTP_HOST: " + process.env.SMTP_HOST + '\n' +
                            "- SMTP_PORT: " + process.env.SMTP_PORT + '\n' +
                            "- SMTP_USER: " + process.env.SMTP_USER + '\n' +
                            "- SMTP_PASS: " + process.env.SMTP_PASS + '\n'

                        await this.telegramBot.sendMessage(chatId, msg)
                    }
                });
                console.log("✅ Telegram Bot ready!")
            }
        }

        async sendMessage(message){
            if (!this.isTokenSet)
                return

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
