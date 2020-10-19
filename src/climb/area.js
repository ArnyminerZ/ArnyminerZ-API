const mysqlSync = require('../utils/mysql-sync')

function serialize(object) {
    return JSON.parse(JSON.stringify(object))
}

module.exports = class EAICArea {
    constructor(mysql) {
        this.mysql = mysql
    }

    async process(request, response) {
        const params = request.params;
        const mysql = this.mysql;

        let areasBuilder = []

        if (params.area == null || params.area < 1)
            try {
                const sql = "SELECT * FROM `EscalarAlcoiaIComtat`.`climbing_areas`;";
                const areas = await mysqlSync.querySync(mysql, sql);
                for (const a in areas)
                    if (areas.hasOwnProperty(a)) {
                        const area = areas[a];
                        area["zones"] = [];
                        const areaSql = "SELECT * FROM `EscalarAlcoiaIComtat`.`climbing_zones` WHERE `area_id`='{0}';"
                            .format(area.id);
                        const zones = await mysqlSync.querySync(mysql, areaSql);
                        for (const z in zones)
                            if (zones.hasOwnProperty(z)) {
                                const zone = zones[z];
                                zone["sectors"] = [];
                                const sectorSql = "SELECT * FROM `EscalarAlcoiaIComtat`.`climbing_sectors` WHERE `climbing_zone`='{0}';"
                                    .format(zone.id);
                                const sectors = await mysqlSync.querySync(mysql, sectorSql);
                                for (const s in sectors)
                                    if (sectors.hasOwnProperty(s)) {
                                        const sector = sectors[s];
                                        const pathSql = "SELECT * FROM `EscalarAlcoiaIComtat`.`climbing_paths` WHERE `sector_id`='{0}';"
                                            .format(sector.id);
                                        const paths = await mysqlSync.querySync(mysql, pathSql);
                                        sector.paths = serialize(paths)
                                        zone["sectors"].push(sector)
                                    }
                                area["zones"].push(zone)
                            }
                        areasBuilder.push(area);
                    }
                response.send(areasBuilder)
            } catch (error) {
                console.error(error)
                response.status(500).send({error});
            }
        else try {
            const sql = "SELECT * FROM `EscalarAlcoiaIComtat`.`climbing_areas` WHERE `id`='{0}';"
                .format(params.area);
            const area = (await mysqlSync.querySync(mysql, sql))[0]
            const areaSql = "SELECT * FROM `EscalarAlcoiaIComtat`.`climbing_zones` WHERE `area_id`='{0}';"
                .format(area.id);
            area["zones"] = [];
            const zones = await mysqlSync.querySync(mysql, areaSql);
            for (const z in zones)
                if (zones.hasOwnProperty(z)) {
                    const zone = zones[z];
                    zone["sectors"] = [];
                    const sectorSql = "SELECT * FROM `EscalarAlcoiaIComtat`.`climbing_sectors` WHERE `climbing_zone`='{0}';"
                        .format(zone.id);
                    const sectors = await mysqlSync.querySync(mysql, sectorSql);
                    for (const s in sectors)
                        if (sectors.hasOwnProperty(s)) {
                            const sector = sectors[s];
                            const pathSql = "SELECT * FROM `EscalarAlcoiaIComtat`.`climbing_paths` WHERE `sector_id`='{0}';"
                                .format(sector.id);
                            const paths = await mysqlSync.querySync(mysql, pathSql);
                            sector.paths = serialize(paths)
                            zone["sectors"].push(sector)
                        }
                    area["zones"].push(zone)
                }
            response.send(area)
        } catch (error) {
            console.error(error)
            response.status(500).send({error});
        }
    }
}
