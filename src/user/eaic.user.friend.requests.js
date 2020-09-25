module.exports = class FriendRequests {
    constructor(mysql) {
        this.mysql = mysql
    }

    process(request, response) {
        const params = request.params;
        const mysql = this.mysql;

        const sql = "SELECT `timestamp`, `uuid`, `from_user` FROM `EscalarAlcoiaIComtat`.`friend_requests` WHERE `consumed`='0' AND `to_user`='{0}';".format(params.user);

        mysql.query(sql, function (error, result) {
            if (error)
                response.status(500).send({error: error});
            else {
                let builder = []
                let counter = 0;
                const toCount = result.length;
                if (toCount > 0) {
                    for (const r in result)
                        if (result.hasOwnProperty(r)) {
                            const request = result[r]
                            const userSql = "SELECT * FROM `EscalarAlcoiaIComtat`.`users` WHERE `uid`='{0}' LIMIT 1;".format(params.user);
                            const fromUserSql = "SELECT * FROM `EscalarAlcoiaIComtat`.`users` WHERE `uid`='{0}' LIMIT 1;".format(request.from_user);

                            mysql.query(userSql, function (error, userResult) {
                                if (error)
                                    response.status(500).send({error: error});
                                else mysql.query(fromUserSql, function (error, fromUserResult) {
                                    if (error)
                                        response.status(500).send({error: error});
                                    else {
                                        if (userResult.length > 0)
                                            request["user"] = userResult[0]
                                        if (fromUserResult.length > 0)
                                            request["requested_user"] = fromUserResult[0]

                                        builder.push(request)

                                        counter++
                                        if (counter >= toCount)
                                            response.status(200).send({result: "ok", data: builder})
                                    }
                                })
                            })
                        }
                } else
                    response.status(200).send({result: "ok", data: builder})
            }
        })
    }
}