const url = require('url');

module.exports = class FirebaseLoginGoogle {
    constructor(auth) {
        this.auth = auth
    }

    process(request, response) {
        const query = request.query;
        const auth = this.auth
        const provider = auth.GoogleAuthProvider();

        provider.addScope('https://www.googleapis.com/auth/userinfo.email')
        provider.addScope('https://www.googleapis.com/auth/userinfo.profile')

        auth.useDeviceLanguage();

        auth.signInWithPopup(provider).then(function (result) {
            // This gives you a Google Access Token. You can use it to access the Google API.
            const credential = result.credential;

            if (query.r != null)
                response.redirect(url.format({
                    pathname: query.r,
                    query: {
                        "credential": credential
                    }
                }))
            else
                response.status(200).send({result: 'ok'}).end();

            auth.signOut()
        }).catch(function (error) {
            // Handle Errors here.
            const errorCode = error.code;
            const errorMessage = error.message;
            // The email of the user's account used.
            response.status(406).send({error: errorCode, message: errorMessage}).end();
        });
    }
}
