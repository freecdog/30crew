/**
 * Created by yarvyk on 04.08.2014.
 */

var express = require('express');
var router = express.Router();

router.get('/', function(req, res) {
    res.render('manage', { title: 'new user:'});
});

module.exports = router;
