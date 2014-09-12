/**
 * Created by jaric on 04.08.2014.
 */

var express = require('express');
var router = express.Router();

var auth = require('./auth');
var newUser = require('./newUser');
var newBannedIp = require('./newBannedIp');
var newUserSpecial = require('./newUserSpecial');
var restartServer = require('./restartServer');

router.use('/auth', auth);
router.use('/newUser', newUser);
router.use('/newBannedIp', newBannedIp);
router.use('/newUserSpecial', newUserSpecial);
router.use('/restartServer', restartServer);

module.exports = router;