const {v4: uuidv4} = require('uuid');

const {sendNotification} = require("./utils.firebase");

module.exports = class FriendRequest {
    constructor(messaging, mysql) {
        this.messaging = messaging
        this.mysql = mysql
    }

    process(request, response) {
        const params = request.params;
        const messaging = this.messaging;

        const ip = request.connection.remoteAddress;
        const agent = request.get('User-Agent');
        const uuid = uuidv4();

        /*const checkAlreadySql = "SELECT `id` FROM `EscalarAlcoiaIComtat`.`friend_requests` (uuid, from_user, to_user, remote_address, agent) VALUES ('{0}', '{1}', '{2}', '{3}', '{4}');"
            .format(uuid, params.user);*/
        const sql = "INSERT INTO `EscalarAlcoiaIComtat`.`friend_requests` (uuid, from_user, to_user, remote_address, agent) VALUES ('{0}', '{1}', '{2}', '{3}', '{4}');"
            .format(uuid, params.user, params.other, ip, agent);

        this.mysql.query(sql, function (error, result) {
            if (error)
                response.status(500).send({error: error});
            else {
                sendNotification(messaging, params.other, "*new_friend_request", "", {
                    from_uid: params.user
                })

                response.status(200).send({result: "ok", uuid: uuid})
            }
        })
    }
}