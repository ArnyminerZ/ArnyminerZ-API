module.exports = class UserChangeProfileImage {
    constructor(mysql, auth) {
        this.mysql = mysql
        this.auth = auth
    }

    process(request, response) {
        const params = request.params;
        const query = request.query;
        const mysql = this.mysql;
        const auth = this.auth;

        if(query.url == null) {
            response.status(400).send({error: "no_url_set"});
        }else{
            const sql = "UPDATE `EscalarAlcoiaIComtat`.`users` SET `profileImage`='{0}' WHERE `uid`='{1}';"
                .format(query.url, params.user);

            mysql.query(sql, function (error, result) {
                if (error)
                    response.status(500).send({error: error});
                else {
                    auth.updateUser(params.user, {
                        photoURL: query.url
                    }).then(function (userRecord) {
                        response.status(200).send({result: "ok", data: result, userRecord: userRecord})
                    }).catch(function (error) {
                        response.status(500).send({error: error});
                    })
                }
            })
        }
    }
}