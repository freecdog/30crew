/**
 * Created by jaric on 05.08.2014.
 */

var express = require('express');
var router = express.Router();

router.post('/', function(req, res) {
    req.app.userInfoLog(req.connection.remoteAddress);

    var newBannedIp = null;

    var bannedIp = req.body.ip;

    if (bannedIp) {

        //var reLogin = /^[A-z0-9_-]{3,16}$/;
        var reIp = new RegExp("^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$");
        //console.log("regexp:", reLogin.test("aAaa"));

        var ipMatch = reIp.test(bannedIp);

        if (ipMatch) {
            var session = req.app.findSession(req.session.id);
            if (session) {
                if (session.name == "c0" || session.name == "c1") {
                    newBannedIp = req.app.newBannedIp(bannedIp);
                } else {
                    console.log("User wants to add new banned ip (" + session.name + "):", bannedIp);
                }
            } else {
                console.log("No session");
            }
        } else {
            console.log("ip isn't match regexp");
        }
    } else {
        console.log("no login");
    }

    res.send(newBannedIp);

    console.log("current banned list:", JSON.stringify(req.app.banned));
});

module.exports = router;
