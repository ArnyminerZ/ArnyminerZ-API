module.exports = class UserData {
    constructor(mysql, auth) {
        this.mysql = mysql
        this.auth = auth
    }

    process(request, response) {
        const params = request.params;
        const mysql = this.mysql;
        const auth = this.auth;

        const sql = "SELECT * FROM `EscalarAlcoiaIComtat`.`users` WHERE `uid`='{0}';"
            .format(params.user);

        mysql.query(sql, function (error, result) {
            if (error)
                response.status(500).send({error: error});
            else{
                if(result.length > 0)
                    return response.status(200).send({result: "ok", data: result})

                // User doesn't exist. Create
                // First get user data
                auth.getUser(params.user)
                    .then(function (userRecord) {
                        const sql = "INSERT INTO `EscalarAlcoiaIComtat`.`users`(`uid`, `username`, `email`, `profileImage`) VALUES ('{0}', '{1}', '{2}', '{3}');"
                            .format(userRecord.uid, userRecord.displayName, userRecord.email, userRecord.photoURL);
                        // Insert new data
                        mysql.query(sql, function (error) {
                            if (error)
                                response.status(500).send({error: error});
                            else{
                                // Retrieve data
                                const sql = "SELECT * FROM `EscalarAlcoiaIComtat`.`users` WHERE `uid`='{0}';"
                                    .format(params.user);
                                mysql.query(sql, function (error, result) {
                                    if (error)
                                        response.status(500).send({error: error});
                                    else
                                        response.status(200).send({result: "ok", data: result})
                                })
                            }
                        })
                    })
                    .catch(function (error) {
                        response.status(500).send({error: error});
                    })
            }
        })
    }
}