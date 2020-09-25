module.exports = {
    sendNotification: (messaging, topic, title, body, data) => {
        const message = {
            notification: {
                title: title,
                body: body
            },
            data: data,
            topic: topic
        };

        messaging.send(message)
            .then((response) => {
                // Response is a message ID string.
                console.log('Successfully sent message:', response);
            })
            .catch((error) => {
                console.log('Error sending message:', error);
            });
    }
}