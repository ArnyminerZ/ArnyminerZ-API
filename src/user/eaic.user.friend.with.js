module.exports = class FriendWith {
    constructor(mysql) {
        this.mysql = mysql
    }

    process(request, response) {
        const params = request.params;
        const mysql = this.mysql;

        const sql = "SELECT * FROM `EscalarAlcoiaIComtat`.`friends` WHERE ((`user_uid`='{0}' AND `friend_uid`='{1}') OR (`user_uid`='{1}' AND `friend_uid`='{0}')) AND `deleted`='0';"
            .format(params.user, params.other);

        const requestedSql = "SELECT * FROM `EscalarAlcoiaIComtat`.`friend_requests` WHERE ((`from_user`='{0}' AND `to_user`='{1}') OR (`from_user`='{1}' AND `to_user`='{0}')) AND `consumed`='0';"
            .format(params.user, params.other);

        mysql.query(sql, function (error, result) {
            if (error)
                response.status(500).send({error: error});
            else if (result.length <= 0)
                mysql.query(requestedSql, function (error, requestsResult) {
                    if (error)
                        response.status(500).send({error: error});
                    else
                        response.status(200).send({result: "ok", friends: false, requested: requestsResult.length > 0})
                })
            else
                response.status(200).send({result: "ok", friends: true, requested: false})
        })
    }
}