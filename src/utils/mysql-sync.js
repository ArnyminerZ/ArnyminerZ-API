module.exports = {
    querySync: (connection, sql) => {
        return new Promise((accept, reject) => {
            connection.query(sql, (error, result) => {
                if (error) reject(error)
                else accept(result)
            })
        })
    }
}
