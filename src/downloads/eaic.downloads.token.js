const {v4: uuidv4} = require('uuid');

module.exports = class DownloadsToken {
    constructor(mysql) {
        this.mysql = mysql
    }

    process(request, response) {
        const params = request.params;
        const mysql = this.mysql;

        const ip = request.connection.remoteAddress;
        const agent = request.get('User-Agent');
        const uuid = uuidv4();

        const sql = "INSERT INTO `EscalarAlcoiaIComtat`.`download_tokens`(`token`,`download`,`ip`,`agent`) VALUES ('{0}','{1}','{2}','{3}');"
            .format(
                uuid,
                params.request,
                ip,
                agent
            );

        mysql.query(sql, function (error, result) {
            if (error)
                response.status(500).send({error: error});
            else
                response.status(200).send({result: "ok", uuid: uuid, data: result})
        })
    }
}