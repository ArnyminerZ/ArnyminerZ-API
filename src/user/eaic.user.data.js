const {loadUser} = require('../auth/user-loader')
const {getToken, isTokenValid} = require('../security/tokenizer')

module.exports = class UserData {
    constructor(mysql) {
        this.mysql = mysql
    }

    async process(request, response) {
        const params = request.params;
        const mysql = this.mysql;

        try {
            const tokenRaw = params.token;
            if (tokenRaw != null && !isTokenValid(tokenRaw))
                return response.status(401).send({error: "token-expired"})
            const token = tokenRaw != null ? getToken(tokenRaw) : null
            const userId = params.user != null ? params.user : token != null ? token : null;
            const user = await loadUser(mysql, userId)
            if (user == null)
                response.status(400).send({error: "user_not_found"})
            else
                return response.status(200).send({result: "ok", data: JSON.stringify(user.dataClass)})
        } catch (error) {
            response.status(500).send(error)
        }
    }
}
