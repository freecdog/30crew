/**
 * Created by yarvyk on 31.07.2014.
 */

var express = require('express');
var router = express.Router();

router.get('/', function(req, res) {
    res.send("auth");
});
router.post('/', function(req, res) {

    console.log(req.body.login, req.body.password);
    if (req.body.login && req.body.password) {

    } else {
        console.log('No login or password was sent');
        res.redirect('/auth');
    }

    res.send("auth");
});

module.exports = router;
