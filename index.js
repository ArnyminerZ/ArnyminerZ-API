// #!/usr/bin/env node
const propertiesReader = require('properties-reader');
const properties = propertiesReader('./eaic.ini');

require('./src/utils/StringUtils')
require('./src/utils/FSUtils')

const {Telegram} = require('./src/communication/Telegram')
const telegram = new Telegram()

const httpPort = properties.get("other.HTTP_PORT") || 3000;
const httpsPort = properties.get("other.HTTPS_PORT") || 3001;

const mysql = require('mysql')
const admin = require("firebase-admin");
const firebase = require("firebase/app");
require("firebase/auth");

const fs = require('fs');

const Sentry = require('@sentry/node');
const Tracing = require("@sentry/tracing");

process.on('exit', async () => {
    await telegram.sendMessage('🛑 EAIC process was exited.')
    console.warn("⚠ Process was exited")
    process.exit()
})
process.on('SIGINT', async () => {
    await telegram.sendMessage('🛑 EAIC Forced close with Ctrl-C')
    console.warn("⚠ Forced close with Ctrl-C")
    process.exit()
});
process.on('SIGUSR1', async () => {
    await telegram.sendMessage('🛑 EAIC Forced close with SIGUSR1')
    console.warn("⚠ Forced close SIGUSR1")
    process.exit()
});
process.on('SIGUSR2', async () => {
    await telegram.sendMessage('🛑 EAIC Forced close with SIGUSR2')
    console.warn("⚠ Forced close SIGUSR2")
    process.exit()
});
process.on('uncaughtException', async (e) => {
    await telegram.sendMessage('🛑 EAIC Had an uncontrolled exception. Log:')
    await telegram.sendMessage(JSON.stringify(e))
    console.error("🛑 Had uncontrolled exception!", e)
});

console.log("🔌 Connecting mysql...");
const con = mysql.createConnection({
    host: properties.get('mysql.MYSQL_HOST'),
    user: properties.get('mysql.MYSQL_USER'),
    password: properties.get('mysql.MYSQL_PASS')
});
con.connect(function (error) {
    if (error)
        console.error("🛑 Could not connect mysql. Error:", error);
    else {
        console.log("✅ MySQL Connected!")

        const serviceAccount = require('./serviceAccountKey.json')

        console.log("🔁 Initializing Firebase Admin...")
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: properties.get('firebase.DATABASE_URL')
        });

        console.log("🔁 Initializing Firebase...")
        firebase.initializeApp({
            apiKey: properties.get('firebase.API_KEY'),
            authDomain: properties.get('firebase.AUTH_DOMAIN'),
            databaseURL: properties.get('firebase.DATABASE_URL'),
            projectId: properties.get('firebase.PROJECT_ID'),
            storageBucket: properties.get('firebase.STORAGE_BUCKET'),
            messagingSenderId: properties.get('firebase.MESSAGING_SERVER_ID'),
            appId: properties.get('firebase.APP_ID'),
            measurementId: properties.get('firebase.MEASUREMENT_ID')
        })

        const http = require('http');
        const https = require('https');
        const express = require('express');
        const myParser = require("body-parser");
        const cors = require('cors');

        console.log("🔁 Setting Up Classes...")
        const FirebaseAuthenticate = require("./src/firebase/firebase.authenticate");
        const FirebaseNotify = require("./src/firebase/firebase.notify");
        const FirebaseQuery = require("./src/firebase/firebase.query");

        const FriendRequest = require("./src/user/eaic.user.friend.request");
        const FriendDelete = require("./src/user/eaic.user.friend.delete");
        const FriendRequests = require("./src/user/eaic.user.friend.requests");
        const FriendAccept = require("./src/user/eaic.user.friend.accept");
        const FriendWith = require("./src/user/eaic.user.friend.with");
        const Friends = require("./src/user/eaic.user.friends");

        const UsersList = require("./src/user/eaic.user.list");
        const UserSearch = require("./src/user/eaic.user.search");
        const UserData = require("./src/user/eaic.user.data");
        const UserLog = require("./src/user/eaic.user.log");
        const UserCompletedPaths = require('./src/user/eaic.user.completed_paths');
        const UserMarkCompleted = require('./src/user/eaic.user.mark_completed');
        const UserChangeUsername = require('./src/user/eaic.user.change.username');
        const UserChangeProfileImage = require('./src/user/eaic.user.change.image');
        const UserPreference = require('./src/user/eaic.user.preference');

        const UserLikedCompletedPath = require('./src/completed_path/eaic.completed_path.liked');
        const CompletedPathsLike = require('./src/completed_path/eaic.completed_paths.like')

        const DownloadsToken = require('./src/downloads/eaic.downloads.token')
        const DownloadsDownload = require('./src/downloads/eaic.downloads.download')

        const EAICArea = require("./src/climb/area");
        const EAICZone = require("./src/climb/zone");
        const EAICSector = require("./src/climb/sector");
        const EAICPath = require("./src/climb/path");

        const {EAICAreaUpdateChecker, EAICZoneUpdateChecker, EAICSectorUpdateChecker} = require("./src/climb/UpdateChecker");

        const credentials = fs.existsSync("/etc/apache2/ssl") ? {
            key: fs.readFileSync('/etc/apache2/ssl/arnyminerz_com.key', 'utf8'),
            cert: fs.readFileSync('/etc/apache2/ssl/arnyminerz_com.crt', 'utf8'),
            ca: [fs.readFileSync('/etc/apache2/ssl/arnyminerz_com.ca-bundle', 'utf8')]
        } : null

        const app = express();

        Sentry.init({
            dsn: "https://75ebb4278af44f57a2be1cadfcf2dbe1@o459660.ingest.sentry.io/5459152",
            integrations: [
                // enable HTTP calls tracing
                new Sentry.Integrations.Http({tracing: true}),
                // enable Express.js middleware tracing
                new Tracing.Integrations.Express({app}),
            ],

            // We recommend adjusting this value in production, or using tracesSampler
            // for finer control
            tracesSampleRate: 1.0,
        });

        app.use(Sentry.Handlers.requestHandler());
        app.use(Sentry.Handlers.tracingHandler());
        app.use(Sentry.Handlers.errorHandler());
        app.use(myParser.urlencoded({extended: true}));
        app.use(cors())

        const messaging = admin.messaging()
        const auth = admin.auth()

        console.log("🔁 Adding GET Listeners...")
        app.get("/firebase/notify", (req, res) => (new FirebaseNotify(messaging)).process(req, res));
        app.get("/firebase/authenticate", (req, res) => (new FirebaseAuthenticate(auth, con)).process(req, res));
        app.get("/firebase/query", (req, res) => (new FirebaseQuery(auth, con)).process(req, res));

        app.get("/user/:user", (req, res) => (new UserData(con).process(req, res)));
        app.get("/user/:user/log", (req, res) => (new UserLog(con).process(req, res)));
        app.get("/user/:user/friend/request/:other", (req, res) => (new FriendRequest(messaging, con).process(req, res)));
        app.get("/user/:user/friend/delete/:other", (req, res) => (new FriendDelete(messaging, con).process(req, res)));
        app.get("/user/:user/friend/requests", (req, res) => (new FriendRequests(con).process(req, res)));
        app.get("/user/:user/friend_with/:other", (req, res) => (new FriendWith(con).process(req, res)));
        app.get("/user/:user/friends", (req, res) => (new Friends(con)).process(req, res));
        app.get("/user/:user/mark_completed/:path", (req, res) => (new UserMarkCompleted(con)).process(req, res));
        app.get("/user/:user/completed_paths", (req, res) => (new UserCompletedPaths(con)).process(req, res));
        app.get("/user/:user/change_username/:new_username", (req, res) => (new UserChangeUsername(con, auth)).process(req, res));
        app.get("/user/:user/change_image", (req, res) => (new UserChangeProfileImage(con, auth)).process(req, res));
        app.get("/user/:user/config/:preference/:value", (req, res) => (new UserPreference(con)).process(req, res));
        app.get("/user/friend/:uuid/:status", (req, res) => (new FriendAccept(messaging, con)).process(req, res));
        app.get("/user/search/:query", (req, res) => (new UserSearch(con)).process(req, res));
        app.get("/users", (req, res) => (new UsersList(con)).process(req, res))

        app.get("/completed_paths/:id/like/:user", (req, res) => (new CompletedPathsLike(con)).process(req, res));
        app.get("/completed_paths/:id/liked/:user", (req, res) => (new UserLikedCompletedPath(con)).process(req, res));

        app.get("/downloads/token/:request", (req, res) => (new DownloadsToken(con)).process(req, res));
        app.get("/download/:token", (req, res) => (new DownloadsDownload(con)).process(req, res));
        app.get("/download/:token", (req, res) => (new DownloadsDownload(con)).process(req, res));

        app.get("/area/:area", (req, res) => (new EAICArea(con)).process(req, res));
        app.get("/zone/:zone", (req, res) => (new EAICZone(con)).process(req, res));
        app.get("/sector/:sector", (req, res) => (new EAICSector(con)).process(req, res));
        app.get("/path/:path", (req, res) => (new EAICPath(con)).process(req, res));

        app.get("/update_available/area/:area", (req, res) => (new EAICAreaUpdateChecker(con)).process(req, res));
        app.get("/update_available/zone/:zone", (req, res) => (new EAICZoneUpdateChecker(con)).process(req, res));
        app.get("/update_available/sector/:sector", (req, res) => (new EAICSectorUpdateChecker(con)).process(req, res));

        app.get('*', (req, res) => {
            res.status(404).send('{"result":"error", "message":"The requested address doesn\'t exist"}')
        }) // Handles 404 since it's the last get

        console.log("🔁 Creating HTTP Server...")
        const httpServer = http.createServer(app)
        httpServer.listen(httpPort, async () => {
            console.log("✅  Server ready on http://localhost:" + httpPort)
            await telegram.sendMessage('ℹ EAIC is listening http on ' + httpPort)
        });

        if (credentials !== undefined && !process.env.ESCALAR_DISABLE_SSL && !properties.get("other.DISABLE_HTTPS")) {
            console.log("🔁 Creating HTTPS Server...")
            const httpsServer = https.createServer(credentials, app);
            httpsServer.listen(httpsPort, async () => {
                console.log("✅  Server ready on http://localhost:" + httpsPort)
                await telegram.sendMessage('ℹ EAIC is listening https on ' + httpsPort)
            });
        }
    }
});
