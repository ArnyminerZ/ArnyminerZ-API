const {stringify: uuid_stringify} = require('uuid')

const mysqlSync = require('../utils/mysql-sync')
const tokenizer = require('../security/tokenizer')

require('../utils/string-utils')

class User {
    /**
     * Initializes the User class
     * @param {Connection} conn The connected MySQL session
     * @param {object} dataClass The data class loaded from the MySQL server
     */
    constructor(conn, dataClass) {
        this.conn = conn;

        this.dataClass = dataClass
        this.id = dataClass.id
        this.registered = dataClass.registered
        this.name = dataClass.name
        this.surname = dataClass.surname
        this.username = dataClass.username
        this.profileImage = dataClass.profileImage
        this.birthDate = dataClass.birthDate
    }

    /**
     * Serializes the class's data into a string
     * @return {string} The serialized data
     */
    stringify() {
        return JSON.stringify(this.dataClass)
    }

    /**
     * Checks if the user has permission to access a section
     * @param {string} sectionName The name of the section
     * @return {Promise<boolean>} If the user has permission to access the section
     */
    hasPermission(sectionName) {
        return new Promise((resolve, reject) => {
            const mysql = this.conn;
            mysql.query(`SELECT \`id\` FROM \`ArnyminerZ\`.\`user_section_rel\` WHERE \`user\`=UNHEX(REPLACE('${this.id}','-','')) AND \`section_name\`='${sectionName}';`, (error, result) => {
                if (error) reject(error)
                else
                    resolve(result.length > 0)
            })
        })
    }

    /**
     * Gets the list with all the permissions the user has
     * @return {Promise<string[]>} The list of permissions
     */
    async getPermissions() {
        const checkSql = "SELECT `section_name` FROM `ArnyminerZ`.`user_section_rel` WHERE `user`=UNHEX(REPLACE('{0}','-',''));"
            .format(this.id)
        const result = await mysqlSync.query(this.conn, checkSql)
        let builder = []

        for (const r in result)
            if (result.hasOwnProperty(r))
                builder.push(result[r]['section_name'])

        return builder
    }

    /**
     * Updates the user's profile image
     * @param newAddress {String} The new profile image address
     * @return {Promise<object>} The query
     */
    async updateImage(newAddress) {
        const updateSql = "UPDATE `ArnyminerZ`.`users` SET `profileImage`='{0}' WHERE `id`=UNHEX(REPLACE('{1}','-',''));"
            .format(newAddress, this.id)
        // TODO: Only update stored data if successfully updated db
        this.profileImage = newAddress
        this.dataClass.profileImage = newAddress
        return mysqlSync.query(this.conn, updateSql)
    }

    /**
     * Gets the user's metadata
     * @return {Promise<object>} The metadata
     */
    async getMeta() {
        const getSql = "SELECT `meta` FROM `ArnyminerZ`.`users` WHERE `id`=UNHEX(REPLACE('{0}','-',''));"
            .format(this.id)
        const result = await mysqlSync.query(this.conn, getSql)
        if (result.length <= 0)
            throw {error: ''}
        return JSON.parse(result[0].meta)
    }

    /**
     * Updates user's data. If any parameter is null, it won't be updated
     * @param name {String|null} The new name for the user
     * @param surname {String|null} The new surname for the user
     * @param email {String|null} The new email for the user
     * @param phoneNumber {String|null} The new phoneNumber for the user
     * @param birthDate {String|null} The new birthDate for the user
     */
    async updateData(name, surname, email, phoneNumber, birthDate) {
        let updates = ''
        if (name != null) updates += "`name`='{0}'".format(name)
        if (surname != null) updates += "`surname`='{0}'".format(surname)
        if (email != null) updates += "`email`='{0}'".format(email)
        if (phoneNumber != null) updates += "`phoneNumber`='{0}'".format(phoneNumber)
        if (birthDate != null) updates += "`birthDate`='{0}'".format(birthDate)

        if (updates.length <= 0) return

        const updateSql = "UPDATE `ArnyminerZ`.`users` SET {0} WHERE `id`=UNHEX(REPLACE('{1}','-',''));"
            .format(updates, this.id)
        await mysqlSync.query(this.conn, updateSql)
    }

    /**
     * Updates user's La NAU data. If any parameter is null, it won't be updated.
     * Note: This won't check if the user is allowed.
     * @param dni {String|null} The new dni for the user
     * @param address {String|null} The new address for the user
     * @param city {String|null} The new city for the user
     * @param zipCode {String|null} The new zip code for the user
     */
    async updateLaNAUData(dni, address, city, zipCode) {
        const meta = await this.getMeta()
        const lanau = meta.lanau || {};

        if (dni != null) lanau.dni = dni
        if (address != null) lanau.address = address
        if (city != null) lanau.city = city
        if (zipCode != null) lanau.zipCode = zipCode

        meta['lanau'] = lanau

        const updateSql = "UPDATE `ArnyminerZ`.`users` SET `meta`='{0}' WHERE `id`=UNHEX(REPLACE('{1}','-',''));"
            .format(JSON.stringify(meta), this.id)
        console.log("SQL:", updateSql)
        return await mysqlSync.query(this.conn, updateSql)
    }
}

/**
 * Loads the data of a user
 * @param {Connection} conn The connected MySQL session
 * @param {string} userId The id or firebase_uid of the user to load
 * @return {User|null} May return null if the user was not found
 */
const loadUser = async (conn, userId) => {
    const idSql = `SELECT * FROM \`ArnyminerZ\`.\`users\` WHERE \`id\`=UNHEX(REPLACE('${userId}','-',''))`
    console.log("Trying id search... SQL:", idSql)
    const idResult = await mysqlSync.query(conn, idSql)
    if (idResult.length > 0) {
        const data = idResult[0]
        console.log("  Result:", data.id)
        console.log("  Result:", data.id.toString())
        data["id"] = uuid_stringify(data.id)
        return new User(conn, data)
    }

    const firebaseSql = "SELECT * FROM `ArnyminerZ`.`users` WHERE `firebase_uid`='{0}';"
        .format(userId)
    console.log("Trying firebase search... SQL:", firebaseSql)
    const firebaseResult = await mysqlSync.query(conn, firebaseSql)
    if (firebaseResult.length > 0) {
        const data = firebaseResult[0]
        data["id"] = uuid_stringify(data.id)
        return new User(conn, data)
    }

    return null
}

module.exports = {
    User,
    loadUser,
    processUser: async (req, res, con) => {
        const body = req.body
        const token = body.token

        if (!token)
            return res.status(400).send({error: "missing-data"})

        const tokenData = await tokenizer.getToken(token)
        const user = await loadUser(con, tokenData.userId)

        if (!user)
            return res.status(400).send({error: "token-not-valid"})

        res.send(JSON.stringify(user.dataClass))
    }
}
