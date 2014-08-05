/**
 * Created by yarvyk on 04.08.2014.
 */

var express = require('express');
var router = express.Router();

var auth = require('./auth');
var newUser = require('./newUser');
var newBannedIp = require('./newBannedIp');

router.use('/auth', auth);
router.use('/newUser', newUser);
router.use('/newBannedIp', newBannedIp);

module.exports = router;