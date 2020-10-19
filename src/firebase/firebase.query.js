require('../../src/utils/StringUtils')
const {querySync} = require('../utils/mysql-sync')

module.exports = class FirebaseQuery {
    constructor(auth, mysql) {
        this.auth = auth
        this.mysql = mysql
    }

    async process(request, response) {
        const auth = this.auth;
        const mysql = this.mysql;

        try {
            const usersList = await auth.listUsers(1000)
            const users = usersList.users
            for (const u in users)
                if (users.hasOwnProperty(u)) {
                    const userRecord = users[u]
                    const displayName = userRecord.displayName
                    const nSplit = displayName.split(' ')
                    const email = userRecord.email
                    const username = email.split('@')[0]

                    const sql = "INSERT INTO `ArnyminerZ`.`users`(`firebase_uid`, `name`, `surname`, `username`, `email`, `profileImage`, `preferences`) VALUES ('{0}', '{1}', '{2}', '{3}', '{4}', '{5}', '{}')"
                        .format(userRecord.uid, nSplit[0], nSplit[1], username, email, userRecord.photoURL)
                    try {
                        const result = await querySync(mysql, sql)
                        console.log(result)
                    } catch (e) {
                        response.status(500).send(err)
                    }
                }
            console.log("ok")
        } catch (e) {
            console.error('Error listing users:', e);
        }
    }
}
