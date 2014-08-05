/**
 * Created by yarvyk on 04.08.2014.
 */

var express = require('express');
var router = express.Router();

router.get('/', function(req, res) {
    console.log(req.connection.remoteAddress);
    res.render('manage', { title: 'Manage:'});
});

module.exports = router;
