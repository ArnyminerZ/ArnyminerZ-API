const fs = require('fs')

require('./src/utils/DebugColors')

let error = ""
let warn = ""

if (!fs.existsSync('./eaic.ini'))
    error += `🛑 ${BgRed}eaic.ini${Reset}${FgRed}               doesn't exist${Reset}\n`

if (!fs.existsSync('./serviceAccountKey.json'))
    error += `🛑 ${BgRed}serviceAccountKey.json${Reset}${FgRed} doesn't exist${Reset}\n`

if (!process.env.TELEGRAM_TOKEN)
    warn += `⚠ ${BgYellow}TELEGRAM_TOKEN${Reset}${FgYellow} is not set, Telegram functionality won't be usable${Reset}\n`

if (error !== ""){
    console.error(error)
    process.exitCode = 1
}
if (warn !== ""){
    console.warn(warn)
    process.exitCode = 0
}