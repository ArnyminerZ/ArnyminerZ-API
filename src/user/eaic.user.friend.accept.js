const {sendNotification} = require("../utils/FirebaseUtils");

module.exports = class FriendRequest {
    constructor(messaging, mysql) {
        this.messaging = messaging
        this.mysql = mysql
    }

    process(request, response) {
        const params = request.params;
        const messaging = this.messaging;
        const mysql = this.mysql;

        const querySql = "SELECT `timestamp`, `uuid`, `from_user`, `to_user` FROM `EscalarAlcoiaIComtat`.`friend_requests` WHERE `consumed`='0' AND `uuid`='{0}';".format(params.uuid);
        const consumeSql = "UPDATE `EscalarAlcoiaIComtat`.`friend_requests` SET `consumed`='1' WHERE `uuid`='{0}'".format(params.uuid);

        if(params.status !== 'accept' && params.status !== 'deny'){
            response.status(400).send({error: "incorrect_request"});
            return
        }

        const accept = params.status === 'accept';

        mysql.query(querySql, function (error, result) {
            if (error)
                response.status(500).send({error: error});
            else {
                const data = result[0];

                const acceptSql = "INSERT INTO `EscalarAlcoiaIComtat`.`friends`(`user_uid`, `friend_uid`) VALUES ('{0}', '{1}')".format(data.from_user, data.to_user);

                mysql.query(consumeSql, function (error, result) {
                    if (error)
                        response.status(500).send({error: error});
                    else {
                        if (accept) {
                            mysql.query(acceptSql, function (error, result) {
                                if (error)
                                    response.status(500).send({error: error});
                                else {
                                    response.status(200).send({result: "ok", accepted: '1'})

                                    sendNotification(messaging, data.to_user, "*friend_request_accepted", "", {
                                        user_uid: data.from_user
                                    })
                                    sendNotification(messaging, data.from_user, "*friend_request_accepted", "", {
                                        user_uid: data.to_user
                                    })
                                }
                            });
                        } else
                            response.status(200).send({result: "ok"})
                    }
                });
            }
        })
    }
}