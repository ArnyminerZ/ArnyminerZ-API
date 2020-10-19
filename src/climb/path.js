const mysqlSync = require('../utils/mysql-sync')

module.exports =
    class EAICPath {
        constructor(mysql) {
            this.mysql = mysql
        }

        async process(request, response) {
            const params = request.params;
            const mysql = this.mysql;

            if (params.path == null || params.path < 1)
                response.status(400).send({error: "no_path_set"});
            else {
                const pathSql = "SELECT * FROM `EscalarAlcoiaIComtat`.`climbing_paths` WHERE `id`='{0}';"
                    .format(`${params.path}`);

                const path = (await mysqlSync.query(mysql, pathSql))[0];
                response.send(path)
            }
        }
    }
