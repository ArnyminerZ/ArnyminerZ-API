module.exports = class UserSearch {
    constructor(mysql) {
        this.mysql = mysql
    }

    process(request, response) {
        const params = request.params;

        const sql = "SELECT * FROM `EscalarAlcoiaIComtat`.`users` WHERE `uid` REGEXP '{0}' OR LOWER(`username`) REGEXP '{0}' OR LOWER(`email`) REGEXP '{0}';"
            .format(`${params.query}`);

        this.mysql.query(sql, function (error, result) {
            if (error)
                response.status(500).send({error: error});
            else {
                let resultDataBuilder = [];
                for (const i in result)
                    if (result.hasOwnProperty(i)) {
                        const item = result[i];
                        let r = {
                            id: item["id"],
                            timestamp: item["timestamp"],
                            uid: item["uid"],
                            role: item["role"],
                            username: item["username"],
                            email: item["email"],
                            born_date: item["born_date"],
                            pref_completedPublic: item["pref_completedPublic"],
                            pref_profilePhotoPublic: item["pref_profilePhotoPublic"],
                            pref_friendsPublic: item["pref_friendsPublic"]
                        };
                        if (item["pref_profilePhotoPublic"] === 1)
                            r["profileImage"] = item["profileImage"];
                        resultDataBuilder.push(r);
                    }
                response.status(200).send({result: "ok", data: resultDataBuilder})
            }
        })
    }
}