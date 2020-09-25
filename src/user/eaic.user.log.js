module.exports = class UserLog {
    constructor(mysql) {
        this.mysql = mysql
    }

    process(request, response) {
        const params = request.params;
        const query = request.query;
        const mysql = this.mysql;

        const sql = "SELECT * FROM `EscalarAlcoiaIComtat`.`friends` WHERE (`user_uid`='{0}' OR `friend_uid`='{0}') AND `deleted`='0'{1};"
            .format(params.user, query.max != null ? ` LIMIT ${query.max}` : "");

        mysql.query(sql, function (error, result) {
            if (error)
                response.status(500).send({error: error});
            else {
                let builder = []
                const toComplete = result.length;
                let completedCounter = 0
                if(result.length > 0) {
                    for (const r in result)
                        if (result.hasOwnProperty(r)) {
                            let row = result[r];

                            const pathSql = "SELECT * FROM `EscalarAlcoiaIComtat`.`completed_path` WHERE `user`='{0}';"
                                .format(row.user_uid === params.user ? row.friend_uid : row.user_uid);

                            mysql.query(pathSql, function (error, pathResult) {
                                if (!error)
                                    builder.push(pathResult)

                                completedCounter++

                                if (completedCounter >= toComplete)
                                    response.status(200).send({result: "ok", data: builder})
                            })
                        }
                }else
                    response.status(200).send({result: "ok", data: builder})
            }
        })
    }
}