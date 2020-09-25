module.exports = class EAICInfo {
    constructor(mysql) {
        this.mysql = mysql
    }

    process(request, response) {
        const sql = "SELECT * FROM `EscalarAlcoiaIComtat`.`info`;"
        this.mysql.query(sql, function (error, result) {
            if (error)
                response.status(500).send({error: error});
            else {
                let builder = {}
                for (const i in result)
                    if (result.hasOwnProperty(i)) {
                        const e = result[i]
                        const key = e.param;
                        builder[key] = e.value
                    }
                response.send(builder)
            }
        })
    }
}
