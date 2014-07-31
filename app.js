var express = require('express');
var path = require('path');
var favicon = require('static-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var routes = require('./routes/index');
var users = require('./routes/users');
var testPassed = require('./routes/testPassed');

var app = express();
var session = require('express-session');

// default config
app.config = {
    "authentication" : true,
    "secret": "someSecret"
};

// TODO, move method to module
function configure(config){
    var fs = require('fs');

    var configPath = __dirname + '/config.txt';

    try {
        var filedata = fs.readFileSync(configPath, {encoding: "utf8"});
        // some hack with first symbol =/
        filedata = filedata.replace(/^\uFEFF/, '');
        // parsing file to JSON object
        var jsondata = JSON.parse(filedata);

        if (jsondata){
            var objectFieldsCounter = 0;
            for (var property in jsondata) {
                if (jsondata.hasOwnProperty(property)) {
                    objectFieldsCounter++;

                    config[property] = jsondata[property];
                }
            }
            console.log("Configured fields:", objectFieldsCounter);
            console.log("Current configuration:", config);
        } else {
            console.log('No json data in file');
        }
    } catch (e) {
        console.log("error:", e);
    }
}
// now config should be loaded from config.txt file
configure(app.config);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(favicon());
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

//var hour = 3600000;
//req.session.cookie.expires = new Date(Date.now() + hour);
//req.session.cookie.maxAge = hour;
app.use(session({
    secret: app.config.secret,
    cookie: {
        expires: null,
        maxAge: null
    }
}));

app.use('/', routes);
app.use('/users', users);
app.use('/testPassed', testPassed);

/// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

app.sessions = {};
// TODO, move to DB
app.users = {
    "c0": "passc0",
    "c1": "passc1"
};

function loadUser(req, res, next) {
    if (config.authentication == false) {
        next();
        return;
    }

    var checkTime = new Date();
    //req.session.user = null;
    if (req.session.id) {
        if (req.session.user == null) {
            UserSessions.find({sessionId: req.session.id}).limit(1).toArray(function(err, currentSessions) {
                if (currentSessions[0]) {
                    Users.find({_id: skin.toId(currentSessions[0].userId)}).limit(1).toArray(function(err, users){
                        if (users[0]) {
                            console.log('2 db queries for ' + (new Date() - checkTime) + ' msec');
                            req.session.message = "Ух ты, " + users[0].login + "!";
                            req.session.user = users[0];
                            next();
                        } else {
                            req.session.message = 'что-то неправильно';
                            next();
                        }
                    });
                } else {
                    req.session.message = 'что-то неправильно';
                    res.redirect('/questionAdd');
                    //res.redirect('/questionsEdit');
                    //next();
                }
            });
        } else {
            next();
        }
    } else {
        req.session.message = 'что-то неправильно';
        res.send('Включите cookies в своем браузере<br>Please enable cookies in your browser');
        //next();
    }
}

/// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});

module.exports = app;