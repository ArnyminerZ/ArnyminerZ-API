const fs = require('fs')

const Color = require('./src/utils/DebugColors')

let error = ""
let warn = ""

if (!fs.existsSync('./api.ini'))
    error += `🛑 ${Color.BgRed}eaic.ini${Color.Reset}${Color.FgRed} doesn't exist${Color.Reset}\n`

if (!process.env.TELEGRAM_TOKEN)
    warn += `⚠ ${Color.BgYellow}TELEGRAM_TOKEN${Color.Reset}${Color.FgYellow} is not set, Telegram functionality won't be usable${Color.Reset}\n`

if (error !== ""){
    console.error(error)
    process.exitCode = 1
}
if (warn !== ""){
    console.warn(warn)
    process.exitCode = 0
}
