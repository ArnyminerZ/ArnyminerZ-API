const {querySync} = require('./mysql-sync')

module.exports = {
    /**
     * Checks if a user exists, and returns its id
     * @return {{Number,String}|null} Returns the user's id and firebase_uid if exists, null otherwise
     */
    findUser: async (mysql, userId) => {
        const checkExistsIdSql = "SELECT `id`, `firebase_uid` FROM `ArnyminerZ`.`users` WHERE `id`='{0}';"
        const checkExistsFirebaseSql = "SELECT `id`, `firebase_uid` FROM `ArnyminerZ`.`users` WHERE `firebase_uid`='{0}';"

        let callerExists = await querySync(mysql, checkExistsIdSql.format(userId))
        if (callerExists.length <= 0)
            callerExists = await querySync(mysql, checkExistsFirebaseSql.format(userId))
        return callerExists.length > 0 ? {id: callerExists[0].id, firebase_uid: callerExists[0].firebase_uid} : null;
    },
    /**
     * Gets all the data from a user
     * @param mysql The mysql connection
     * @param userId The user id
     * @return {Object|null} The user data or null if not exist
     */
    getUser: async (mysql, userId) => {
        const userIdSql = "SELECT * FROM `ArnyminerZ`.`users` WHERE `id`='{0}';"
        const userFirebaseSql = "SELECT * FROM `ArnyminerZ`.`users` WHERE `firebase_uid`='{0}';"

        let userRequest = await querySync(mysql, userIdSql.format(userId))
        if (userRequest.length <= 0)
            userRequest = await querySync(mysql, userFirebaseSql.format(userId))
        if (userRequest.length <= 0)
            return null

        const user = userRequest[0]

        // Populate the pref_ keys for legacy use
        const userPreferences = JSON.parse(user.preferences)
        for (const p in userPreferences)
            if (userPreferences.hasOwnProperty(p))
                user["pref_" + p] = userPreferences[p]

        return user
    }
}
