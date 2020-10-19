const {getUser} = require('../utils/user-utils')
const {query} = require('../utils/mysql-sync')

module.exports = class UserChangeProfileImage {
    constructor(mysql, auth) {
        this.mysql = mysql
        this.auth = auth
    }

    async process(request, response) {
        const params = request.params;
        const query = request.query;
        const mysql = this.mysql;
        const auth = this.auth;

        if (query.url == null) {
            response.status(400).send({error: "no_url_set"});
        } else {
            try {
                // First check if user exists and get data
                const user = await getUser(mysql, params.user)
                if (user == null)
                    response.status(400).send({error: "user_not_found"})

                const sql = "UPDATE `ArnyminerZ`.`users` SET `profileImage`='{0}' WHERE `id`='{1}';"
                    .format(query.url, user.id);

                const result = await query(mysql, sql)
                const userRecord = await auth.updateUser(params.user, {photoURL: query.url})
                response.status(200).send({result: "ok", data: result, userRecord: userRecord})
            } catch (e) {
                response.status(500).send({error: e});
            }
        }
    }
}
