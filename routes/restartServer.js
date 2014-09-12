/**
 * Created by jaric on 13.09.2014.
 */

var express = require('express');
var router = express.Router();

router.post('/', function(req, res) {
    req.app.userInfoLog(req.connection.remoteAddress);

    var session = req.app.findSession(req.session.id);
    if (session) {
        if (session.name == "jaric" || session.name == "ZsM") {
            res.send('Trying to restart');
            req.app.updateServer(function(error, stdout, stderr){
                req.app.restartServer();
            });
        } else {
            console.log("User wants to restart server (" + session.name + "):");
        }
    } else {
        console.log("No valid session to restart server");
    }
});

module.exports = router;
