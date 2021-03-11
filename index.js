// #!/usr/bin/env node
const propertiesReader = require('properties-reader');
const properties = propertiesReader('./api.ini');
require('dotenv').config()

require('./src/utils/string-utils')
require('./src/utils/FSUtils')

const {Telegram} = require('./src/communication/Telegram')
const telegram = new Telegram()

const httpPort = properties.get("other.HTTP_PORT") || 3000;
const httpsPort = properties.get("other.HTTPS_PORT") || 3001;

const mysql = require('mysql')

const fs = require('fs');

const Sentry = require('@sentry/node');
const Tracing = require("@sentry/tracing");

//<editor-fold desc=">> Error handlers">
console.log("🔁 Adding error handlers...")
process.on('exit', async () => {
    await telegram.sendMessage('🛑 ArnyminerZ API process was exited.')
    console.warn("⚠ Process was exited")
    process.exit()
})
process.on('SIGINT', async () => {
    await telegram.sendMessage('🛑 ArnyminerZ API Forced close with Ctrl-C')
    console.warn("⚠ Forced close with Ctrl-C")
    process.exit()
});
process.on('SIGUSR1', async () => {
    await telegram.sendMessage('🛑 ArnyminerZ API Forced close with SIGUSR1')
    console.warn("⚠ Forced close SIGUSR1")
    process.exit()
});
process.on('SIGUSR2', async () => {
    await telegram.sendMessage('🛑 ArnyminerZ API Forced close with SIGUSR2')
    console.warn("⚠ Forced close SIGUSR2")
    process.exit()
});
process.on('uncaughtException', async (e) => {
    await telegram.sendMessage('🛑 ArnyminerZ API Had an uncontrolled exception. Log:')
    await telegram.sendMessage(JSON.stringify(e))
    console.error("🛑 Had uncontrolled exception!", e)
});
//</editor-fold>

//<editor-fold desc=">> Set the default value for some variables">
if (!process.env.MAX_PEOPLE_PER_BOOKING)
    process.env.MAX_PEOPLE_PER_BOOKING = properties.get('lanau.MAX_PEOPLE_PER_BOOKING') || '5';

if (!process.env.TOKEN_EXPIRATION_TIME)
    process.env.TOKEN_EXPIRATION_TIME = properties.get('token.TOKEN_EXPIRATION_TIME') || 600000;
if (!process.env.TOKEN_LONG_MULTIPLIER)
    process.env.TOKEN_LONG_MULTIPLIER = properties.get('token.TOKEN_LONG_MULTIPLIER') || 6;
if (!process.env.TOKEN_STORAGE_EFFICIENT)
    process.env.TOKEN_STORAGE_EFFICIENT = properties.get('token.TOKEN_STORAGE_EFFICIENT') || true;
if (!process.env.TOKENS_PATH)
    process.env.TOKENS_PATH = properties.get('token.TOKENS_PATH') || '_tokens.json';
//</editor-fold>

//<editor-fold desc=">> Environment variables check">
console.log("🔁 Checking for required environment variables...")
let error = 0;
if (process.env.SMTP_HOST == null) {
    console.log("🛑 Missing SMTP_HOST variable")
    error = 1;
}
if (process.env.SMTP_PORT == null) {
    console.log("🛑 Missing SMTP_PORT variable")
    error = 1;
}
if (process.env.SMTP_USER == null) {
    console.log("🛑 Missing SMTP_USER variable")
    error = 1;
}
if (process.env.SMTP_PASS == null) {
    console.log("🛑 Missing SMTP_PASS variable")
    error = 1;
}
if (error > 0)
    process.exit(1)
//</editor-fold>

console.log("🔌 Connecting mysql...");
const con = mysql.createConnection({
    host: properties.get('mysql.MYSQL_HOST'),
    port: properties.get('mysql.MYSQL_PORT'),
    user: properties.get('mysql.MYSQL_USER'),
    password: properties.get('mysql.MYSQL_PASS')
});
con.connect(function (error) {
    if (error)
        console.error("🛑 Could not connect mysql. Error:", error);
    else {
        console.log("✅ MySQL Connected!")

        const http = require('http');
        const https = require('https');
        const express = require('express');
        const myParser = require("body-parser");
        const cors = require('cors');

        console.log("🔁 Setting Up Classes...")
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

        const {processLogin, processTokenValidation} = require('./src/auth/login')
        const {processCreatePassword, processConfirmPassword} = require('./src/auth/management')
        const {processAvatarChange, processDataChange} = require('./src/auth/profile')
        const {processUser} = require('./src/auth/user-loader')

        const {processLaNauProfileDataChange} = require('./src/lanau/profile/data')
        const {processLaNauBookCreation} = require('./src/lanau/book/creation')
        const {processLaNauBookCheckAvailable} = require('./src/lanau/book/utils')
        const {processLaNauBookDelete, processLaNauBookEditable, processLaNauBookQuery, processLaNauBookUpdate} = require('./src/lanau/book/management')

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
        app.get("/user_data/:token", (req, res) => (new UserData(con).process(req, res)));
        app.get("/user/:user", (req, res) => (new UserData(con).process(req, res)));
        app.get("/user/:user/log", (req, res) => (new UserLog(con).process(req, res))); // TODO: Wtf is this?
        app.get("/user/:user/friend/request/:other", (req, res) => (new FriendRequest(messaging, con).process(req, res)));
        app.get("/user/:user/friend/delete/:other", (req, res) => (new FriendDelete(messaging, con).process(req, res)));
        app.get("/user/:user/friend/requests", (req, res) => (new FriendRequests(con).process(req, res)));
        app.get("/user/:user/friend_with/:other", (req, res) => (new FriendWith(con).process(req, res)));
        app.get("/user/:user/friends", (req, res) => (new Friends(con)).process(req, res));
        app.get("/user/:user/mark_completed/:path", (req, res) => (new UserMarkCompleted(con)).process(req, res));
        app.get("/user/:user/completed_paths", (req, res) => (new UserCompletedPaths(con)).process(req, res));
        app.get("/user/:user/change_username/:new_username", (req, res) => (new UserChangeUsername(con, auth)).process(req, res));
        app.get("/user/:user/change_image", (req, res) => (new UserChangeProfileImage(con, auth)).process(req, res));
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

        console.log("🔁 Adding POST listeners...")
        app.post('/user', (q, r) => processUser(q, r, con))
        app.post('/login', (q, r) => processLogin(q, r, con))
        app.post('/token', (q, r) => processTokenValidation(q, r, con))
        app.post('/create-password', (q, r) => processCreatePassword(q, r, con))
        app.post('/confirm-password', (q, r) => processConfirmPassword(q, r, con))
        app.post('/profile/avatar', (q, r) => processAvatarChange(q, r, con))
        app.post('/profile/data', (q, r) => processDataChange(q, r, con))
        app.post('/profile/lanau-data', (q, r) => processLaNauProfileDataChange(q, r, con))
        app.post('/lanau/book', (q, r) => processLaNauBookCreation(q, r, con))
        app.post('/lanau/book/check_availability', (q, r) => processLaNauBookCheckAvailable(q, r, con))
        app.post('/lanau/book/:id', (q, r) => processLaNauBookQuery(q, r, con))
        app.post('/lanau/book/:id/delete', (q, r) => processLaNauBookDelete(q, r, con))
        app.post('/lanau/book/:id/editable', (q, r) => processLaNauBookEditable(q, r, con))
        app.post('/lanau/book/:id/update', (q, r) => processLaNauBookUpdate(q, r, con))

        console.log("🔁 Creating HTTP Server...")
        const httpServer = http.createServer(app)
        httpServer.listen(httpPort, async () => {
            console.log("✅  Server ready on http://localhost:" + httpPort)
            await telegram.sendMessage('ℹ ArnyminerZ API is listening http on ' + httpPort)
        });

        if (credentials !== undefined && !process.env.ESCALAR_DISABLE_SSL && !properties.get("other.DISABLE_HTTPS")) {
            console.log("🔁 Creating HTTPS Server...")
            const httpsServer = https.createServer(credentials, app);
            httpsServer.listen(httpsPort, async () => {
                console.log("✅  Server ready on http://localhost:" + httpsPort)
                await telegram.sendMessage('ℹ ArnyminerZ API is listening https on ' + httpsPort)
            });
        }
    }
});
