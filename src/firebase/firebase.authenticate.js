module.exports = class FirebaseAuthenticate {
    constructor(auth, mysql) {
        this.auth = auth
        this.mysql = mysql
    }

    process(request, response) {
        const query = request.query;
        const auth = this.auth;
        const mysql = this.mysql;

        if (query.email == null)
            response.status(400).send({error: "no_email_set"});
        else
            auth.getUserByEmail(query.email)
                .then(function (userRecord) {
                    const sql = "SELECT `id`, `role`, `username` FROM `EscalarAlcoiaIComtat`.`users` WHERE `uid`='{0}'".format(userRecord.uid)
                    mysql.query(sql, function (error, result) {
                        if (error)
                            response.status(500).send({error: error});
                        else {
                            let record = JSON.parse(JSON.stringify(userRecord));
                            record.id = result[0].id;
                            record.role = result[0].role;
                            record.username = result[0].username;
                            response.status(200).send({result: "ok", data: result, record: record})
                        }
                    })
                })
                .catch(function (error) {
                    if (error.code === 'auth/user-not-found' && query.register === 'true')
                        auth.createUser({
                            email: query.email,
                            password: query.password,
                            displayName: query.displayName || query.email.substring(0, query.email.indexOf("@")),
                            photoURL: query.photoURL || "https://api.adorable.io/avatars/256/" + query.email
                        }).then(function (userRecord) {
                            const sql = "INSERT INTO `EscalarAlcoiaIComtat`.`users` (uid, username, email, profileImage) VALUES ('{0}', '{1}', '{2}', '{3}')".format(userRecord.uid, userRecord.displayName, userRecord.email, userRecord.photoURL)
                            mysql.query(sql, function (error, result) {
                                if (error)
                                    response.status(500).send({error: error});
                                else {
                                    let record = JSON.parse(JSON.stringify(userRecord));
                                    record.id = result[0].id;
                                    record.role = result[0].role;
                                    response.status(200).send({result: "ok", data: result, record: record})
                                }
                            })
                        }).catch(function (error) {
                            console.error(error);
                            response.status(500).send({error: error});
                        });
                    else
                        response.status(500).send({error: error});
                })
    }
}
