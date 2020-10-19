const mysqlSync = require('../utils/mysql-sync')

function serialize(object) {
    return JSON.parse(JSON.stringify(object))
}

module.exports = class EAICSector {
    constructor(mysql) {
        this.mysql = mysql
    }

    async process(request, response) {
        const params = request.params;
        const mysql = this.mysql;

        if (params.sector == null || params.sector < 1)
            response.status(400).send({error: "no_sector_set"});
        else {
            const sectorSql = "SELECT * FROM `EscalarAlcoiaIComtat`.`climbing_sectors` WHERE `id`='{0}';"
                .format(params.sector);
            const sector = (await mysqlSync.query(mysql, sectorSql))[0];
            const pathSql = "SELECT * FROM `EscalarAlcoiaIComtat`.`climbing_paths` WHERE `sector_id`='{0}';"
                .format(sector.id);
            const paths = await mysqlSync.query(mysql, pathSql);
            sector.paths = serialize(paths)
            response.send(sector)
        }
    }
}
