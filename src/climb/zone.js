const mysqlSync = require('../utils/mysql-sync')

function serialize(object) {
    return JSON.parse(JSON.stringify(object))
}

module.exports = class EAICZone {
    constructor(mysql) {
        this.mysql = mysql
    }

    async process(request, response) {
        const params = request.params;
        const mysql = this.mysql;

        if (params.zone == null || params.zone < 1)
            response.status(400).send({error: "no_zone_set"});
        else try {
            const zoneSql = "SELECT * FROM `EscalarAlcoiaIComtat`.`climbing_zones` WHERE `id`='{0}';"
                .format(params.zone);
            const zone = (await mysqlSync.query(mysql, zoneSql))[0];
            zone["sectors"] = [];
            const sectorSql = "SELECT * FROM `EscalarAlcoiaIComtat`.`climbing_sectors` WHERE `climbing_zone`='{0}';"
                .format(zone.id);
            const sectors = await mysqlSync.query(mysql, sectorSql);
            for (const s in sectors)
                if (sectors.hasOwnProperty(s)) {
                    const sector = sectors[s];
                    const pathSql = "SELECT * FROM `EscalarAlcoiaIComtat`.`climbing_paths` WHERE `sector_id`='{0}';"
                        .format(sector.id);
                    const paths = await mysqlSync.query(mysql, pathSql);
                    sector.paths = serialize(paths)
                    zone["sectors"].push(sector)
                }
            response.send(zone)
        } catch (error) {
            console.error(error)
            response.status(500).send({error});
        }
    }
}
