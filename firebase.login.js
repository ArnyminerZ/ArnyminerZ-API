module.exports = class FirebaseLogin {
    constructor(auth, mysql) {
        this.auth = auth
        this.mysql = mysql
    }

    process(request, response) {
        const body = request.body;
        const auth = this.auth;
        const mysql = this.mysql;

        if (body.email == null)
            response.status(400).send({error: "no_email_set"});
        else if (body.password == null)
            response.status(400).send({error: "no_password_set"});
        else
            auth.signInWithEmailAndPassword(body.email, body.password)
                .then(function (record) {
                    const uid = record.user.uid
                    const sql = `SELECT * FROM \`EscalarAlcoiaIComtat\`.\`users\` WHERE \`uid\`='${uid}' LIMIT 1;`
                    mysql.query(sql, (error, result) => {
                        if (error)
                            response.status(500).send({error: error}).end()
                        else
                            response.status(200).send({result: 'ok', data: result}).end();
                    })
                    auth.signOut()
                })
                .catch(function (error) {
                    // Handle Errors here.
                    const errorCode = error.code;
                    const errorMessage = error.message;
                    // ...
                    response.status(406).send({error: errorCode, message: errorMessage}).end();
                });
    }
}
