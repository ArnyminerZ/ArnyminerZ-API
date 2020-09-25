const { sendNotification } = require("./utils.firebase");

module.exports = class FirebaseNotify {
    constructor(messaging) {
        this.messaging = messaging
    }

    process(request, response) {
        const query = request.query;
        if (query.topic == null)
            response.status(400).send({error: "no_topic_set"});
        else {
            sendNotification(this.messaging, query.topic, query.title, query.message, {
                from_uid: query.from_uid || "null"
            })

            response.status(200).send({result: "ok"});
        }
    }
}
