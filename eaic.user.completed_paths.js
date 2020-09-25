module.exports = class UserCompletedPaths {
    constructor(mysql) {
        this.mysql = mysql
    }

    process(request, response) {
        const params = request.params;
        const query = request.query;
        const mysql = this.mysql;

        const sql = "SELECT * FROM `EscalarAlcoiaIComtat`.`completed_path` WHERE `deleted`='0' AND `user`='{0}'{1}{2};"
            .format(
                params.user,
                query.sort != null ?
                    query.sort === 'date_asc' ? ' ORDER BY `timestamp` ASC' :
                        query.sort === 'date_desc' ? ' ORDER BY `timestamp` DESC' :
                            "" : "",
                query.max != null ? ` LIMIT ${query.max}` : ""
            );

        mysql.query(sql, function (error, result) {
            if (error)
                response.status(500).send({error: error});
            else {
                let builder = []
                const toComplete = result.length;
                let completedCounter = 0
                if (toComplete > 0) {
                    for (const r in result)
                        if (result.hasOwnProperty(r)) {
                            let row = result[r];

                            const pathSql = "SELECT * FROM `EscalarAlcoiaIComtat`.`climbing_paths` WHERE `id`='{0}';"
                                .format(`${row.path_id}`);

                            mysql.query(pathSql, function (error, pathResult) {
                                if (error)
                                    row.path = error
                                else
                                    row.path = pathResult[0]
                                builder.push(row)

                                completedCounter++

                                if (completedCounter >= toComplete)
                                    response.status(200).send({result: "ok", data: builder})
                            })
                        }
                } else
                    response.status(200).send({result: "ok", data: builder})
            }
        })
    }
}