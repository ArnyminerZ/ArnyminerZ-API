module.exports = class UserLikedCompletedPath {
    constructor(mysql) {
        this.mysql = mysql
    }

    process(request, response) {
        const params = request.params;
        const mysql = this.mysql;

        const sql = "SELECT * FROM `EscalarAlcoiaIComtat`.`completed_path` WHERE `id`='{0}';"
            .format(params.id);

        mysql.query(sql, function (error, result) {
            if (error)
                response.status(500).send({error: error});
            else {
                if(result.length >= 0){
                    const completedPath = result[0]
                    const likes = JSON.parse(completedPath != null ? completedPath.likes || "[]" : "[]")
                    console.log("Result:", result, "Likes:", likes)
                    response.status(200).send({result: 'ok', liked:likes.includes(params.user)})
                }else
                    response.status(500).send({error: "not_found"});
            }
        })
    }
}