const {query} = require('../utils/mysql-sync')
const {loadUser} = require('../auth/user-loader')

module.exports = class FriendRequests {
    constructor(mysql) {
        this.mysql = mysql
    }

    async process(request, response) {
        const params = request.params;
        const mysql = this.mysql;

        const userIdSql = "SELECT * FROM `EscalarAlcoiaIComtat`.`friend_requests` WHERE NOT `consumed`='1' AND `to_user_id`='{0}';"
        const userFirebaseSql = "SELECT * FROM `EscalarAlcoiaIComtat`.`friend_requests` WHERE NOT `consumed`='1' AND `to_user`='{0}';"

        try {
            // First check if user exists
            const user = await loadUser(mysql, params.user)
            if (user == null)
                return response.status(400).send({error: 'user-doesnt-exist'});

            let requests = await query(mysql, userIdSql.format(user.id))
            if (requests.length <= 0)
                requests = await query(mysql, userFirebaseSql.format(user.firebase_uid))
            if (requests.length <= 0) // If user has no requests
                return response.send({result: 'ok', data: []})
            else {
                const builder = []
                for (const r in requests)
                    if (requests.hasOwnProperty(r)) {
                        const request = requests[r]
                        const caller = await loadUser(mysql, request.from_user_id) || await loadUser(mysql, request.from_user)
                        const called = await loadUser(mysql, request.to_user_id) || await loadUser(mysql, request.to_user)
                        request["user"] = JSON.parse(JSON.stringify(caller))
                        request["requested_user"] = JSON.parse(JSON.stringify(called))
                        builder.push(request)
                    }
                response.status(200).send({result: "ok", data: builder})
            }
        } catch (e) {
            response.status(500).send({error: e});
        }
    }
}
