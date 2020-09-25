module.exports = class UserMarkCompleted {
    constructor(mysql) {
        this.mysql = mysql
    }

    process(request, response) {
        const params = request.params;
        const query = request.query;
        const mysql = this.mysql;

        if(query.type == null)
            return response.status(200).send({error: "no_type_set"})
        else if(query.attempts == null)
            return response.status(200).send({error: "no_attempts_set"})
        else if(query.hangs == null)
            return response.status(200).send({error: "no_hangs_set"})

        const sql = "INSERT INTO `EscalarAlcoiaIComtat`.`completed_path`(`path_id`, `type`, `attempts`, `hangs`, `user`) VALUES ('{0}','{1}','{2}','{3}','{4}');"
            .format(
                params.path,
                query.type,
                query.attempts,
                query.hangs,
                params.user
            );

        mysql.query(sql, function (error, result) {
            if (error)
                response.status(500).send({error: error});
            else
                response.status(200).send({result: "ok", data: result})
        })
    }
}