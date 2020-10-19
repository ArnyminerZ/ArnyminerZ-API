const {loadUser} = require('../auth/user-loader')

module.exports = class UserData {
    constructor(mysql) {
        this.mysql = mysql
    }

    async process(request, response) {
        const params = request.params;
        const mysql = this.mysql;

        try {
            const user = await loadUser(mysql, params.user)
            if (user == null)
                response.status(400).send({error: "user_not_found"})
            else
                return response.status(200).send({result: "ok", data: user})
        } catch (error) {
            response.status(500).send(error)
        }
    }
}
