const {v4: uuidv4} = require('uuid');

const {sendNotification} = require("../utils/FirebaseUtils");
const {querySync} = require('../utils/mysql-sync')
const {findUser} = require('../utils/UserUtils')

module.exports = class FriendRequest {
    constructor(messaging, mysql) {
        this.messaging = messaging
        this.mysql = mysql
    }

    async process(request, response) {
        const params = request.params;
        const messaging = this.messaging;
        const mysql = this.mysql;

        if (params.user === params.other)
            return response.status(400).send({error: 'cannot-ask-same'});

        const checkFriendsSql = "SELECT `id` FROM `EscalarAlcoiaIComtat`.`friends` WHERE NOT `deleted`='1' AND `user_id`='{0}' AND `friend_id`='{1}';"
        const requestSql = "INSERT INTO `EscalarAlcoiaIComtat`.`friend_requests` (uuid, from_user_id, to_user_id, remote_address, agent) VALUES ('{0}', '{1}', '{2}', '{3}', '{4}');"
        try {
            // First check if caller exists
            const caller = await findUser(mysql, params.user)
            if (caller == null)
                return response.status(400).send({error: 'user-doesnt-exist'});

            // Then, check if called exists
            const called = await findUser(mysql, params.other)
            if (called == null)
                return response.status(400).send({error: 'friend-doesnt-exist'});

            // Now let's check if users are already friends
            const alreadyFriends = await querySync(mysql, checkFriendsSql.format(caller.id, called.id))
            if (alreadyFriends.length > 0)
                return response.status(400).send({error: 'users-already-friends'});

            // Get some parameters to fill
            const ip = request.connection.remoteAddress;
            const agent = request.get('User-Agent');
            const uuid = uuidv4();
            // Execute the call
            await querySync(mysql, requestSql.format(uuid, caller.id, called.id, ip, agent))

            // Send notification through the old firebase-uid-based receiver system
            sendNotification(messaging, called.firebase_uid, "*new_friend_request", "", {
                from_uid: caller.firebase_uid,
                from_user: caller.id
            })
            // Send notification through the new user-[id] based receiver system
            sendNotification(messaging, 'user-' + called.id, "*new_friend_request", "", {
                from_uid: caller.firebase_uid,
                from_user: called.id
            })

            response.status(200).send({result: "ok", uuid: uuid})
        } catch (e) {
            response.status(500).send({error: e});
        }
    }
}
