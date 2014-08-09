/**
 * Created by jaric on 10.08.2014.
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

        var rePassword = new RegExp("^[A-z0-9_-]{4,18}$");

        var loginMatch = reLogin.test(login);
        var passwordMatch = rePassword.test(password);

        if (loginMatch && passwordMatch) {
            newUser = req.app.newUser(login, password);
        } else {
            if (!loginMatch) console.log("login isn't match regexp");
            if (!passwordMatch) console.log("password isn't match regexp");
        }
    } else {
        if (!login) console.log("no login");
        if (!password) console.log("no password");
    }

    res.send(newUser);

    console.log("current users list:", JSON.stringify(req.app.users));
});

module.exports = router;
