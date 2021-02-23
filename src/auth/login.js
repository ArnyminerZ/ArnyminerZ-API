const crypto = require('../security/crypto')
const tokenizer = require('../security/tokenizer')
const mysqlSync = require('../utils/mysql-sync')
const {checkToken} = require('./token-checker')

module.exports = {
    processLogin: async (req, res, con) => {
        const body = req.body;

        if (!body.username || !body.password)
            return res.status(400).send({error: "missing-data"})

        try {
            const sql = "SELECT ArnyminerZ.uuid_of(`id`), `hash`, `salt`, `iterations` FROM `ArnyminerZ`.`users` WHERE `username`='{0}'"
                .format(body.username)
            const loginResult = await mysqlSync.query(con, sql)
            if (loginResult.length <= 0)
                res.status(400).send({error: 'user-not-found'})
            else {
                const data = loginResult[0]
                const userId = data['ArnyminerZ.uuid_of(`id`)']
                if (data.hash == null || data.hash.length <= 0)
                    res.status(400).send({error: 'user-has-no-password'});
                else {
                    const passwordCorrect = await crypto.verifyPassword(data, body.password)
                    if (passwordCorrect) {
                        const token = tokenizer.generateToken(
                            data.hash, data.salt, data.iterations, userId,
                            // If remember is checked, the token will last 30 days
                            new Date(body.remember === 'true' ? new Date(30 * 24 * 60 * 60 * 1000) : new Date())
                        )
                        console.log("New user logged in with token", token)
                        res.cookie('token', token, {maxAge: (body.remember === 'true' ? process.env.TOKEN_LONG_MULTIPLIER : 1) * process.env.TOKEN_EXPIRATION_TIME})
                        res.send({token});
                    } else
                        res.status(400).send({error: 'wrong-password'});
                }
            }
        } catch (e) {
            console.error('Could not log in:', e)
            return res.status(500).send(e)
        }
    },
    processTokenValidation: async (req, res, con) => {
        try {
            const user = await checkToken(req, res, con, false, false)
            return res.send({result: 'ok', data: {valid: user == null}})
        } catch (e) {
            console.error('Could validate token:', e)
            return res.status(500).send(e)
        }
    }
}
