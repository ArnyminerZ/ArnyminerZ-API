const fs = require('fs')
const nodemailer = require('nodemailer')

const mysqlSync = require('../utils/mysql-sync')

module.exports = {
    processCreatePassword: async (req, res, con) => {
        const body = req.body;
        const email = body.email;
        const username = body.username;

        if (!email || !username)
            return res.status(400).send({error: "missing-data"})

        try {
            // >> Let's check if the username matches the email, and if the user exists, btw
            const checkUserSql = "SELECT `id` FROM `ArnyminerZ`.`users` WHERE `email`='{0}' AND `username`='{1}';"
                .format(email, username)
            const checkUserResult = await mysqlSync.query(con, checkUserSql)
            if (checkUserResult.length <= 0)
                return res.status(400).send({error: "mismatching-data"})

            // >> Let's generate a UUID
            const invitationSql = "INSERT INTO `ArnyminerZ`.`confirmation_codes`(`uuid`,`email`) VALUES (UNHEX(REPLACE(UUID(),'-','')), '{0}')"
                .format(email)
            const invitationResult = await mysqlSync.query(con, invitationSql)
            const codeId = invitationResult.insertId

            // >> Now get the UUID
            const uuidGetSql = "SELECT ArnyminerZ.uuid_of(`uuid`) FROM `ArnyminerZ`.`confirmation_codes` WHERE `id`='{0}'"
                .format(codeId)
            const uuidGetResult = await mysqlSync.query(con, uuidGetSql)
            const uuid = uuidGetResult[0]['ArnyminerZ.uuid_of(`uuid`)'];

            const emailContent = fs.readFileSync('./templates/create-password.html', 'utf8').format(req.protocol + '://' + req.get('host') + '/create-password/' + uuid, uuid)

            // >> Create the mail transporter
            const MAIL_TRANSPORTER = nodemailer.createTransport({
                host: process.env.SMTP_HOST,
                port: process.env.SMTP_PORT,
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS
                }
            });

            // >> Now we have to send the mail
            const emailSend = await MAIL_TRANSPORTER.sendMail({
                from: 'noreply@arnyminerz.com',
                to: email,
                subject: 'Create Password for arnyminerz.com',
                html: emailContent
            })
            res.send(emailSend)
        } catch (e) {
            return res.status(500).send({error: e})
        }
    },

    processConfirmPassword: async (req, res, con) => {
        const body = req.body;
        const email = body.email;
        const password = body.password;
        const uuid = body.uuid;

        if (!email || !password || !uuid)
            return res.status(400).send({error: "missing-data"})

        try {
            // >> First let's check if the uuid is valid and matches the email
            const uuidCheckSql = "SELECT `id` FROM `ArnyminerZ`.`confirmation_codes` WHERE `uuid`=UNHEX(REPLACE('{0}','-','')) AND `email`='{1}'"
                .format(uuid, email)
            const uuidCheckResult = await mysqlSync.query(con, uuidCheckSql)
            if (uuidCheckResult.length <= 0)
                return res.status(400).send({error: 'code_invalid_or_mismatching'})
            const confirmationCodeId = uuidCheckResult[0].id

            // >> Now let's check if the user already has a password
            const passwordCheckSql = "SELECT ArnyminerZ.uuid_of(`id`), `hash` FROM `ArnyminerZ`.`users` WHERE `email`='{0}';"
                .format(email)
            const passwordCheckResult = await mysqlSync.query(con, passwordCheckSql)
            if (passwordCheckResult.length <= 0)
                return res.status(400).send({error: 'user_not_found'})
            const userAuth = passwordCheckResult[0]
            const userId = userAuth['ArnyminerZ.uuid_of(`id`)']
            if (userAuth.hash.toString().length > 0)
                return res.status(400).send({error: 'user_already_authed'})

            // >> Ok, now we can generate the credentials
            const encPassword = await crypto.generateHashPassword(password)

            // >> And store them in the database
            const updateUserSql = "UPDATE `ArnyminerZ`.`users` SET `hash`='{0}',`salt`='{1}',`iterations`='{2}',`confirmed`='1' WHERE `id`=UNHEX(REPLACE('{3}','-',''));"
                .format(encPassword.hash, encPassword.salt, encPassword.iterations, userId)
            const updateUserResult = await mysqlSync.query(con, updateUserSql)
            if (updateUserResult.affectedRows <= 0)
                return res.status(500).send({error: 'insert_error'})

            // >> Now delete the confirmation code
            const dropConfirmationCodeSql = "DELETE FROM `ArnyminerZ`.`confirmation_codes` WHERE `id`='{0}';"
                .format(confirmationCodeId)
            await mysqlSync.query(con, dropConfirmationCodeSql)

            // And return the successful result
            res.send({result: 'ok'})
        } catch (e) {
            res.status(500).send(e)
        }
    }
}
