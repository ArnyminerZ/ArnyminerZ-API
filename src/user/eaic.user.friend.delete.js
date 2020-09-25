const {sendNotification} = require("../utils/FirebaseUtils");

module.exports = class FriendDelete {
    constructor(messaging, mysql) {
        this.mysql = mysql
        this.messaging = messaging
    }

    process(request, response) {
        const params = request.params;
        const messaging = this.messaging

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