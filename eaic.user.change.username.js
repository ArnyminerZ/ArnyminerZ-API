module.exports = class UserChangeUsername {
    constructor(mysql, auth) {
        this.mysql = mysql
        this.auth = auth
    }

    process(request, response) {
        const params = request.params;
        const mysql = this.mysql;
        const auth = this.auth;

        const sql = "UPDATE `EscalarAlcoiaIComtat`.`users` SET `username`='{0}' WHERE `uid`='{1}';"
            .format(params.new_username, params.user);

        mysql.query(sql, function (error, result) {
            if (error)
                response.status(500).send({error: error});
            else {
                auth.updateUser(params.user, {
                    displayName: params.new_username
                }).then(function (userRecord) {
                    response.status(200).send({result: "ok", data: result, userRecord: userRecord})
                }).catch(function (error) {
                    response.status(500).send({error: error});
                })
            }
        })
    }
}