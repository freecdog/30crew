/**
 * Created by yarvyk on 04.08.2014.
 */

var express = require('express');
var router = express.Router();

var auth = require('./auth');
var newUser = require('./newUser');

router.use('/auth', auth);
router.use('/newUser', newUser);

module.exports = router;