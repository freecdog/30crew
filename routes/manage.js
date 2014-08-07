/**
 * Created by yarvyk on 04.08.2014.
 */

var express = require('express');
var router = express.Router();

router.get('/', function(req, res) {
    req.app.userInfoLog(req.connection.remoteAddress);
    res.render('manage', { title: 'Manage:'});
});

module.exports = router;
