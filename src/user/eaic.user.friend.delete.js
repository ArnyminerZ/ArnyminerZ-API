const {sendNotification} = require("../utils/FirebaseUtils");
const {query} = require('../utils/mysql-sync')
const {findUser} = require('../utils/user-utils')

module.exports = class FriendDelete {
    constructor(messaging, mysql) {
        this.mysql = mysql
        this.messaging = messaging
    }

    async process(request, response) {
        const params = request.params;
        const messaging = this.messaging;
        const mysql = this.mysql;

        const checkFriendsUserSql = "SELECT `id` FROM `EscalarAlcoiaIComtat`.`friends` WHERE NOT `deleted`='1' AND (`user_id`='{0}' AND `friend_id`='{1}') OR (`user_id`='{1}' AND `friend_id`='{0}') LIMIT 1;"
        const checkFriendsFirebaseSql = "SELECT `id` FROM `EscalarAlcoiaIComtat`.`friends` WHERE NOT `deleted`='1' AND (`user_uid`='{0}' AND `friend_uid`='{1}') OR (`user_uid`='{1}' AND `friend_uid`='{0}') LIMIT 1;"

        const deleteSql = "UPDATE `EscalarAlcoiaIComtat`.`friends` SET `deleted`='1' WHERE `id`='{0}' LIMIT 1;";

        try {
            // First, check if both users exist
            // First check if caller exists
            const caller = await findUser(mysql, params.user)
            if (caller == null)
                return response.status(400).send({error: 'user-doesnt-exist'});

            // Then, check if called exists
            const called = await findUser(mysql, params.other)
            if (called == null)
                return response.status(400).send({error: 'friend-doesnt-exist'});

            // Now check if users are friends
            let friendsCheck = await query(mysql, checkFriendsUserSql.format(caller.id, called.id))
            if (friendsCheck.length <= 0)
                friendsCheck = await query(mysql, checkFriendsFirebaseSql.format(caller.firebase_uid, called.firebase_uid))
            if (friendsCheck.length <= 0)
                response.status(400).send({error: 'users-are-not-friends'});

            await query(mysql, deleteSql.format(friendsCheck[0].id))
            response.status(200).send({result: "ok"})
        } catch (e) {
            response.status(500).send({error: e});
        }

        const sql = "UPDATE `EscalarAlcoiaIComtat`.`friends` SET `deleted`='1' WHERE `user_uid`='{0}' AND `friend_uid`='{1}' OR `user_uid`='{1}' AND `friend_uid`='{0}' LIMIT 1;"
            .format(params.user, params.other);

        this.mysql.query(sql, function (error, result) {
            if (error)
                response.status(500).send({error: error});
            else {
                sendNotification(messaging, params.other, "*friend_removed", "", {
                    user_uid: params.user
                })

                response.status(200).send({result: "ok", data: result})
            }
        })
    }
}
