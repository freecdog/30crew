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
    var promo = req.body.promo;

    if (login && password && promo) {

        //var reLogin = /^[A-z0-9_-]{3,16}$/;
        var reLogin = new RegExp("^[A-z0-9_-]{3,16}$");
        //console.log("regexp:", reLogin.test("aAaa"));

        var rePassword = new RegExp("^[A-z0-9_-]{4,16}$");
        var rePromo = new RegExp("^[A-z0-9]{16}$");

        var loginMatch = reLogin.test(login);
        var passwordMatch = rePassword.test(password);
        var promoMatch = rePromo.test(promo);

        if (loginMatch && passwordMatch && promoMatch) {
            newUser = req.app.newUser(login, password, promo);
            console.log("newUser", newUser);
        } else {
            if (!loginMatch) console.log("login isn't match regexp");
            if (!passwordMatch) console.log("password isn't match regexp");
            if (!promoMatch) console.log("promo isn't match regexp");
        }
    } else {
        if (!login) console.log("no login");
        if (!password) console.log("no password");
        if (!promo) console.log("no promo");
    }

    res.send(newUser);

    //console.log("current users list:", JSON.stringify(req.app.users));
});

module.exports = router;
