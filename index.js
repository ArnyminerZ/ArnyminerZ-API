// #!/usr/bin/env node
const propertiesReader = require('properties-reader');
const properties = propertiesReader('./eaic.ini');

if (!String.prototype.format) {
    String.prototype.format = function () {
        const args = arguments;
        return this.replace(/{(\d+)}/g, function (match, number) {
            return typeof args[number] != 'undefined'
                ? args[number]
                : match
                ;
        });
    };
}

const deleteFolderRecursive = function (folderPath) {
    if (fs.existsSync(folderPath)) {
        fs.readdirSync(folderPath).forEach((file, index) => {
            const curPath = path.join(folderPath, file);
            if (fs.lstatSync(curPath).isDirectory()) { // recurse
                deleteFolderRecursive(curPath);
            } else { // delete file
                fs.unlinkSync(curPath);
            }
        });
        fs.rmdirSync(folderPath);
    }
};

const httpPort = 3000;
const httpsPort = 3001;
const clearDownloadsCacheTime = 60 * 60 * 1000; // 60 minutes

const mysql = require('mysql')
const admin = require("firebase-admin");
const firebase = require("firebase/app");
require("firebase/auth");

const fs = require('fs');
const path = require('path');

console.log("Connecting mysql...");
const con = mysql.createConnection({
    host: properties.get('mysql.MYSQL_HOST'),
    user: properties.get('mysql.MYSQL_USER'),
    password: properties.get('mysql.MYSQL_PASS')
});
con.connect(function (error) {
    if (error)
        console.error("Could not connect mysql. Error:", error);
    else {
        console.log("Connected!")

        const serviceAccount = require('./serviceAccountKey.json')

        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://escalaralcoiaicomtat.firebaseio.com"
        });

        firebase.initializeApp({
            apiKey: "AIzaSyCkOPsHr1kGv9r4wC9xoKiEncTvtyGpKYI",
            authDomain: "escalaralcoiaicomtat.firebaseapp.com",
            databaseURL: "https://escalaralcoiaicomtat.firebaseio.com",
            projectId: "escalaralcoiaicomtat",
            storageBucket: "escalaralcoiaicomtat.appspot.com",
            messagingSenderId: "532137251314",
            appId: "1:532137251314:web:985a0745bd90ac8cd01b6b",
            measurementId: "G-49HGMS07LW"
        })

        const http = require('http');
        const https = require('https');
        const express = require('express');
        const myParser = require("body-parser");
        const cors = require('cors');

        const FirebaseAuthenticate = require("./firebase.authenticate");
        const FirebaseNotify = require("./firebase.notify");
        const FirebaseLogin = require("./firebase.login");
        const FirebaseLoginGoogle = require("./firebase.login.google");

        const FriendRequest = require("./eaic.user.friend.request");
        const FriendDelete = require("./eaic.user.friend.delete");
        const FriendRequests = require("./eaic.user.friend.requests");
        const FriendAccept = require("./eaic.user.friend.accept");
        const FriendWith = require("./eaic.user.friend.with");
        const Friends = require("./eaic.user.friends");

        const UsersList = require("./eaic.user.list");
        const UserSearch = require("./eaic.user.search");
        const UserData = require("./eaic.user.data");
        const UserLog = require("./eaic.user.log");
        const UserCompletedPaths = require('./eaic.user.completed_paths');
        const UserMarkCompleted = require('./eaic.user.mark_completed');
        const UserChangeUsername = require('./eaic.user.change.username');
        const UserChangeProfileImage = require('./eaic.user.change.image');
        const UserPreference = require('./eaic.user.preference');

        const UserLikedCompletedPath = require('./eaic.completed_path.liked');
        const CompletedPathsLike = require('./eaic.completed_paths.like')

        const DownloadsToken = require('./eaic.downloads.token')
        const DownloadsDownload = require('./eaic.downloads.download')

        const EAICArea = require("./climb/area");
        const EAICZone = require("./climb/zone");
        const EAICSector = require("./climb/sector");
        const EAICPath = require("./climb/path");

        const {EAICAreaUpdateChecker, EAICZoneUpdateChecker, EAICSectorUpdateChecker} = require("./climb/UpdateChecker");

        const EAICInfo = require("./eaic.info");

        const credentials = fs.existsSync("/etc/apache2/ssl") ? {
            key: fs.readFileSync('/etc/apache2/ssl/arnyminerz_com.key', 'utf8'),
            cert: fs.readFileSync('/etc/apache2/ssl/arnyminerz_com.crt', 'utf8'),
            ca: [fs.readFileSync('/etc/apache2/ssl/arnyminerz_com.ca-bundle', 'utf8')]
        } : null

        const app = express();

        app.use(myParser.urlencoded({extended: true}));
        app.use(cors())

        const messaging = admin.messaging()
        const auth = admin.auth()
        const firebaseAuth = firebase.auth()

        const firebaseNotify = new FirebaseNotify(messaging)
        const firebaseAuthenticate = new FirebaseAuthenticate(auth, con)
        const firebaseLogin = new FirebaseAuthenticate(auth, con)
        const firebaseLoginGoogle = new FirebaseLoginGoogle(firebaseAuth)
        app.get("/firebase/notify", (req, res) => firebaseNotify.process(req, res));
        app.get("/firebase/authenticate", (req, res) => firebaseAuthenticate.process(req, res));
        app.get("/firebase/login", (req, res) => firebaseLogin.process(req, res));

        app.get("/firebase/google_login", (req, res) => firebaseLoginGoogle.process(req, res));

        app.get("/user/:user", (req, res) => {
            new UserData(con, auth).process(req, res);
        });
        app.get("/user/:user/log", (req, res) => {
            new UserLog(con).process(req, res);
        });
        app.get("/user/:user/friend/request/:other", (req, res) => {
            new FriendRequest(messaging, con).process(req, res);
        });
        app.get("/user/:user/friend/delete/:other", (req, res) => {
            new FriendDelete(messaging, con).process(req, res);
        });
        app.get("/user/:user/friend/requests", (req, res) => {
            new FriendRequests(con).process(req, res);
        });
        app.get("/user/:user/friend_with/:other", (req, res) => {
            new FriendWith(con).process(req, res);
        });
        app.get("/user/:user/friends", (req, res) => (new Friends(con)).process(req, res));
        app.get("/user/:user/mark_completed/:path", (req, res) => (new UserMarkCompleted(con)).process(req, res));
        app.get("/user/:user/completed_paths", (req, res) => (new UserCompletedPaths(con)).process(req, res));
        app.get("/user/:user/change_username/:new_username", (req, res) => (new UserChangeUsername(con, auth)).process(req, res));
        app.get("/user/:user/change_image", (req, res) => (new UserChangeProfileImage(con, auth)).process(req, res));
        app.get("/user/:user/config/:preference/:value", (req, res) => (new UserPreference(con)).process(req, res));
        app.get("/user/friend/:uuid/:status", (req, res) => (new FriendAccept(messaging, con)).process(req, res));
        app.get("/user/search/:query", (req, res) => (new UserSearch(con)).process(req, res));
        app.get("/users", (req, res) => (new UsersList(con)).process(req, res))
        app.get("/completed_paths/:id/like/:user", (req, res) => {
            new CompletedPathsLike(con).process(req, res);
        });
        app.get("/completed_paths/:id/liked/:user", (req, res) => {
            new UserLikedCompletedPath(con).process(req, res);
        });

        app.get("/downloads/token/:request", (req, res) => {
            new DownloadsToken(con).process(req, res);
        });
        app.get("/download/:token", (req, res) => {
            new DownloadsDownload(con).process(req, res);
        });
        app.get("/download/:token", (req, res) => {
            new DownloadsDownload(con).process(req, res);
        });

        app.get("/area/:area", (req, res) => {
            new EAICArea(con).process(req, res);
        });
        app.get("/zone/:zone", (req, res) => {
            new EAICZone(con).process(req, res);
        });
        app.get("/sector/:sector", (req, res) => {
            new EAICSector(con).process(req, res);
        });
        app.get("/path/:path", (req, res) => {
            new EAICPath(con).process(req, res);
        });

        app.get("/update_available/area/:area", (req, res) => (new EAICAreaUpdateChecker(con)).process(req, res));
        app.get("/update_available/zone/:zone", (req, res) => (new EAICZoneUpdateChecker(con)).process(req, res));
        app.get("/update_available/sector/:sector", (req, res) => (new EAICSectorUpdateChecker(con)).process(req, res));

        app.get("/info", (req, res) => (new EAICInfo(con)).process(req, res));

        app.get('*', (req, res) => {
            res.status(404).send('{"result":"error", "message":"The requested address doesn\'t exist"}')
        }) // Handles 404 since it's the last get

        const httpServer = http.createServer(app)
        console.log("Listening on " + httpPort)
        httpServer.listen(httpPort, () => {
            console.log("  server starting on port : " + httpPort)
            console.log("  Server ready on http://localhost:" + httpPort)
        });

        if (credentials != null) {
            const httpsServer = https.createServer(credentials, app);
            console.log("Listening on " + httpsPort)
            httpsServer.listen(httpsPort, () => {
                console.log("  server starting on port : " + httpsPort)
                console.log("  Server ready on https://localhost:" + httpsPort)
            });
        }

        // This isn't required with the new downloads method
        /*console.log("Scheduling downloads cache clear task")
        setInterval(function () {
            console.log("Clearing Downloads...");
            http.request("http://escalaralcoiaicomtat.centrexcursionistalcoi.org/api/download_data/clear", function (response) {
                let str = '';

                response.on('data', function (chunk) {
                    str += chunk;
                });

                response.on('end', function () {
                    console.log("  Completed downloads clearing: ", str);
                });
            }).end();
            console.log("Clearing cache...");
            deleteFolderRecursive(path.join(__dirname, "cache"));
        }, clearDownloadsCacheTime);*/
    }
});
