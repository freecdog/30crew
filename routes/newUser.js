/**
 * Created by yarvyk on 04.08.2014.
 */

var express = require('express');
var router = express.Router();

router.post('/', function(req, res) {
    req.app.userInfoLog(req.connection.remoteAddress);

    var newUser = null;

    var login = req.body.login;
    var password = req.body.password;

    if (login && password) {

        //var reLogin = /^[A-z0-9_-]{3,16}$/;
        var reLogin = new RegExp("^[A-z0-9_-]{3,16}$");
        //console.log("regexp:", reLogin.test("aAaa"));

        var rePassword = new RegExp("^[A-z0-9_-]{4,16}$");

        var loginMatch = reLogin.test(login);
        var passwordMatch = rePassword.test(password);

        if (loginMatch && passwordMatch) {
            var session = req.app.findSession(req.session.id);
            if (session) {
                if (session.name == "c0" || session.name == "c1") {
                    newUser = req.app.newUser(login, password);
                } else {
                    console.log("User wants to add new user (" + session.name + "):", login, password);
                }
            } else {
                console.log("No session");
            }
        } else {
            if (!loginMatch) console.log("login isn't match regexp");
            if (!passwordMatch) console.log("password isn't match regexp");
        }
    } else {
        if (!login) console.log("no login");
        if (!password) console.log("no password");
    }

    res.send(newUser);

    //console.log("current users list:", JSON.stringify(req.app.users));
});

module.exports = router;
