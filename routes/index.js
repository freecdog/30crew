var express = require('express');
var router = express.Router();

router.get('/', function(req, res) {
    console.log(req.connection.remoteAddress);
    //console.log(JSON.stringify(req.app.sessions));
    res.render('index', { title: 'Листья', host: req.headers.host});
});

module.exports = router;
