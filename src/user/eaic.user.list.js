const {querySync} = require('../utils/mysql-sync')

module.exports = class UsersList {
    constructor(mysql) {
        this.mysql = mysql
    }

    async process(request, response) {
        const sql = "SELECT * FROM `ArnyminerZ`.`users`;";

        try {
            const result = await querySync(this.mysql, sql)

            let resultDataBuilder = [];
            for (const i in result)
                if (result.hasOwnProperty(i)) {
                    const item = result[i];
                    const preferences = JSON.parse(item["preferences"] || "{}")
                    const completedPublic = preferences["completedPublic"]
                    const profilePhotoPublic = preferences["profilePhotoPublic"]
                    const friendsPublic = preferences["friendsPublic"]
                    let r = {
                        id: item["id"],
                        timestamp: item["timestamp"],
                        uid: item["uid"],
                        role: item["role"],
                        username: item["username"],
                        email: item["email"],
                        born_date: item["born_date"],
                        preferences: preferences,
                        pref_completedPublic: completedPublic,
                        pref_profilePhotoPublic: profilePhotoPublic,
                        pref_friendsPublic: friendsPublic
                    };
                    if (item["pref_profilePhotoPublic"] === 1)
                        r["profileImage"] = item["profileImage"];
                    resultDataBuilder.push(r);
                }
            response.status(200).send({result: "ok", data: resultDataBuilder})
        } catch (error) {
            response.status(500).send({error: error});
        }
    }
}
