require('../utils/ArrayUtils')

module.exports = class CompletedPathsLike {
    constructor(mysql) {
        this.mysql = mysql
    }

    process(request, response) {
        const params = request.params;
        const mysql = this.mysql;

        const sql = "SELECT * FROM `EscalarAlcoiaIComtat`.`completed_path` WHERE `deleted`='0' AND `id`='{0}' LIMIT 1;"
            .format(
                params.id
            );

        mysql.query(sql, function (error, result) {
            if (error)
                response.status(500).send({error: error});
            else {
                if(result.length <= 0)
                    response.status(400).send({error: "path_not_found"});
                else {
                    const completedPath = result[0]
                    const likes = JSON.parse(completedPath.likes || "[]");
                    if(likes.includes(params.user))
                        likes.remove(params.user)
                    else
                        likes.push(params.user)

                    const updateSql = "UPDATE `EscalarAlcoiaIComtat`.`completed_path` SET `likes`='{0}' WHERE `deleted`='0' AND `id`='{1}' LIMIT 1;"
                        .format(
                            JSON.stringify(likes),
                            params.id
                        );

                    mysql.query(updateSql, function (error, updateResult) {
                        if (error)
                            response.status(500).send({error: error});
                        else
                            response.status(200).send({result:'ok', data: updateResult, likes: likes})
                    })
                }
            }
        })
    }
}