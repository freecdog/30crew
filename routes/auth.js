/**
 * Created by yarvyk on 31.07.2014.
 */

var express = require('express');
var router = express.Router();

router.get('/', function(req, res) {
    res.send("testPassed");
});

module.exports = router;
