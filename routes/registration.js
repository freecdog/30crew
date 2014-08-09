/**
 * Created by jaric on 09.08.2014.
 */

var express = require('express');
var router = express.Router();

router.get('/', function(req, res) {
    req.app.userInfoLog(req.connection.remoteAddress);
    res.render('registration', { title: 'Registration:'});
});

module.exports = router;
