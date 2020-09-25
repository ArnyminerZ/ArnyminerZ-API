Array.prototype.remove = function() {
    let what, a = arguments, L = a.length, ax;
    while (L && this.length) {
        what = a[--L];
        while ((ax = this.indexOf(what)) !== -1) {
            this.splice(ax, 1);
        }
    }
    return this;
};

module.exports = class UserCompletedPathsLike {
    constructor(mysql) {
        this.mysql = mysql
    }

    process(request, response) {
        const params = request.params;
        const mysql = this.mysql;

        const sql = "SELECT * FROM `EscalarAlcoiaIComtat`.`completed_path` WHERE `deleted`='0' AND `user`='{0}' AND `id`='{1}' LIMIT 1;"
            .format(
                params.user,
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
                    if(likes.includes(params.like_user))
                        likes.remove(params.like_user)
                    else
                        likes.push(params.like_user)

                    const updateSql = "UPDATE `EscalarAlcoiaIComtat`.`completed_path` SET `likes`='{1}' WHERE `deleted`='0' AND `user`='{0}' AND `id`='{2}' LIMIT 1;"
                        .format(
                            params.user,
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