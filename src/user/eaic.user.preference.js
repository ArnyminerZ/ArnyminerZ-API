module.exports = class UserPreference {
    constructor(mysql) {
        this.mysql = mysql
    }

    process(request, response) {
        const params = request.params;
        const user = params.user;
        const pref = params.preference;
        const val = params.value;

        if(pref !== 'completedPublic' && pref !== 'profilePhotoPublic'){
            response.status(400).send({error: "no_valid_pref_set"});
            return
        }

        const value = (val === '1' || val === 'true') ? '1' : '0'

        const sql = "UPDATE `EscalarAlcoiaIComtat`.`users` SET `pref_{1}`='{2}' WHERE `uid`='{0}';"
            .format(user, pref, value);

        this.mysql.query(sql, function (error, result) {
            if (error)
                response.status(500).send({error: error});
            else {
                response.status(200).send({result: "ok", data: result})
            }
        })
    }
}