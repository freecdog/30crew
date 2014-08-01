var express = require('express');
var router = express.Router();

router.get('/', function(req, res) {
    console.log(JSON.stringify(req.app.sessions));
    res.render('index', { title: 'branches'});
});

module.exports = router;
