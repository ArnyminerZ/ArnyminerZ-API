module.exports = {
    EAICAreaUpdateChecker: class EAICAreaUpdateChecker {
        constructor(mysql) {
            this.mysql = mysql
        }

        process(request, response) {
            const params = request.params;
            const query = request.query;

            const version = query.version;
            if (version == null)
                return response.status(400).send({error: 'version-not-set'})

            const sql = "SELECT `version` FROM `EscalarAlcoiaIComtat`.`climbing_areas` WHERE `id`='{0}';"
                .format(params.area)
            this.mysql.query(sql, function (error, result) {
                if (error)
                    response.status(500).send({error: error});
                else if (result.length > 0) {
                    const latestVersion = result[0].version;

                    response.send({'update-available': parseInt(version) < parseInt(latestVersion)})
                } else response.status(404).send({error: 'area-not-found'})
            })
        }
    },

    EAICZoneUpdateChecker: class EAICZoneUpdateChecker {
        constructor(mysql) {
            this.mysql = mysql
        }

        process(request, response) {
            const params = request.params;
            const query = request.query;

            const version = query.version;
            if (version == null)
                return response.status(400).send({error: 'version-not-set'})

            const sql = "SELECT `version` FROM `EscalarAlcoiaIComtat`.`climbing_zones` WHERE `id`='{0}';"
                .format(params.zone)
            this.mysql.query(sql, function (error, result) {
                if (error)
                    response.status(500).send({error: error});
                else if (result.length > 0) {
                    const latestVersion = result[0].version;

                    response.send({'update-available': parseInt(version) < parseInt(latestVersion)})
                } else response.status(404).send({error: 'zone-not-found'})
            })
        }
    },

    EAICSectorUpdateChecker: class EAICSectorUpdateChecker {
        constructor(mysql) {
            this.mysql = mysql
        }

        process(request, response) {
            const params = request.params;
            const query = request.query;

            const version = query.version;
            if (version == null)
                return response.status(400).send({error: 'version-not-set'})

            const sql = "SELECT `version` FROM `EscalarAlcoiaIComtat`.`climbing_sectors` WHERE `id`='{0}';"
                .format(params.sector)
            this.mysql.query(sql, function (error, result) {
                if (error)
                    response.status(500).send({error: error});
                else if (result.length > 0) {
                    const latestVersion = result[0].version;

                    response.send({'update-available': parseInt(version) < parseInt(latestVersion)})
                } else response.status(404).send({error: 'sector-not-found'})
            })
        }
    }
}
