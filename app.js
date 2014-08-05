var express = require('express');
var path = require('path');
var favicon = require('static-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var routes = require('./routes/index');
var manage = require('./routes/manage');

var api = require('./routes/api');

var app = express();
var session = require('express-session');

// default config
app.config = {
    "authentication" : true,
    "secret": "someSecret"
};

// TODO, move method to module
function loadFromJSONFile(extendedObject, filePath){
    var fs = require('fs');

    try {
        var filedata = fs.readFileSync(filePath, {encoding: "utf8"});
        // some hack with first symbol =/
        filedata = filedata.replace(/^\uFEFF/, '');
        // parsing file to JSON object
        var jsondata = JSON.parse(filedata);

        if (jsondata){
            var objectFieldsCounter = 0;
            for (var property in jsondata) {
                if (jsondata.hasOwnProperty(property)) {
                    objectFieldsCounter++;

                    extendedObject[property] = jsondata[property];
                }
            }
            console.log("Loaded fields:", objectFieldsCounter);
            console.log("Current object:", extendedObject);
        } else {
            console.log('No json data in file');
        }
    } catch (e) {
        console.log("error:", e);
    }
}
// now config should be loaded from config.txt file
//console.log(JSON.stringify(app.config));
loadFromJSONFile(app.config, path.join(__dirname, 'config.txt'));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// list of banned IPs
app.banned = {};
loadFromJSONFile(app.banned, path.join(__dirname, 'banned.txt'));
app.newBannedIp = function(bannedIp){
    var ans = null;

    if (app.banned.hasOwnProperty(bannedIp)) {
        console.log("bannedIp already exist");
    } else {
        app.banned[bannedIp] = true;

        var fs = require('fs');

        var filePath = path.join(__dirname, 'banned.txt');
        try {
            var filedata = fs.readFileSync(filePath, {encoding: "utf8"});
            // some hack with first symbol =/
            filedata = filedata.replace(/^\uFEFF/, '');
            // parsing file to JSON object
            var jsondata = JSON.parse(filedata);

            if (jsondata){
                jsondata[bannedIp] = true;

                fs.writeFileSync(filePath, JSON.stringify(jsondata));
            } else {
                console.log('No json data in file');
            }
        } catch (e) {
            console.log("error:", e);
        }

        ans = {bannedIp: true};
    }

    return ans;
};
var ipbanfilter = require('./ipbanfilter');
app.use(ipbanfilter());

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
app.use('/manage', manage);

app.use('/api', api);

/// catch 404 and forward to error handler
app.use(function(req, res, next) {
    console.log(req.connection.remoteAddress);
    var err = new Error('Hey ;) (' + req.connection.remoteAddress + '). You call this bad neighbourhood?');
    err.status = 404;
    next(err);
});

app.sessions = {};
app.addSession = function(sessionID, username){
    var session = null;
    if (app.sessions.hasOwnProperty(sessionID)){
        delete app.sessions[sessionID];

        session = {};
        session.name = username;
        session.time = new Date();
        app.sessions[sessionID] = session;
    } else {
        session = {};
        session.name = username;
        session.time = new Date();
        app.sessions[sessionID] = session;
    }
    return session;
};
app.findSession = function(sessionID){
    var session = null;
    if (app.sessions.hasOwnProperty(sessionID)){
        session = app.sessions[sessionID];
    }
    return session;
};

// TODO, move to DB, maybe config too?
app.users = {};
loadFromJSONFile(app.users, path.join(__dirname, 'users.txt'));
app.findUser = function(login, password){
    var user = null;
    if (app.users.hasOwnProperty(login)){
        var userPassword = app.users[login];
        if (userPassword == password) {
            user = {name: login};
        }
    }
    return user;
};
app.newUser = function(login, password){
    var ans = null;

    if (app.users.hasOwnProperty(login)) {
        console.log("login already exist");
    } else {
        app.users[login] = password;

        var fs = require('fs');

        var filePath = path.join(__dirname, 'users.txt');
        try {
            var filedata = fs.readFileSync(filePath, {encoding: "utf8"});
            // some hack with first symbol =/
            filedata = filedata.replace(/^\uFEFF/, '');
            // parsing file to JSON object
            var jsondata = JSON.parse(filedata);

            if (jsondata){
                jsondata[login] = password;

                fs.writeFileSync(filePath, JSON.stringify(jsondata));
            } else {
                console.log('No json data in file');
            }
        } catch (e) {
            console.log("error:", e);
        }

        ans = app.findUser(login, password);
    }

    return ans;
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

            for (var user in app.users) {
                if (app.users.hasOwnProperty(user)){
                    ;
                }
            }

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