/**
 * Created by yarvyk on 31.07.2014.
 */

var express = require('express');
var router = express.Router();
var _und = require("../public/javascripts/underscore");

router.get('/', function(req, res) {
    res.send("auth");
});
router.post('/', function(req, res) {

    console.log(req.body.login, req.body.password);
    if (req.body.login && req.body.password) {
        var user = req.app.findUser(req.body.login, req.body.password);
        console.log("user:", user);
        if (user){
            var session = req.app.addSession(req.session.id, req.body.login);
            console.log("session:", session);
            if (session) {
                res.send(_und.extend(user, session));
            } else {
                console.log("No session");
                res.send(null);
            }
        } else {
            console.log("No user");
            res.send(null);
        }
    } else {
        if (!req.body.login) console.log('No login');
        if (!req.body.password) console.log('No password');
        res.send(null);
    }
});

module.exports = router;
