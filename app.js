var express = require('express');
var path = require('path');
var favicon = require('static-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var crypto = require('crypto');

var routes = require('./routes/index');
var manage = require('./routes/manage');
var registration = require('./routes/registration');

var api = require('./routes/api');

var app = express();
var session = require('express-session');

app.userInfoLog = function(ip){
    console.log(ip, new Date());
};

// default config
app.config = {
    "authentication" : true,
    "secret": "someSecret"
};

// TODO, move method to module
function loadFromJSONFile(extendedObject, filePath){
    console.log(filePath);
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
app.use('/registration', registration);

app.use('/api', api);

/// catch 404 and forward to error handler
app.use(function(req, res, next) {
    app.userInfoLog(req.connection.remoteAddress);
    var err = new Error('Hey ;) (' + req.connection.remoteAddress + '). You call this bad neighbourhood?');
    err.status = 404;
    next(err);
});

app.getHash = function(password){
    var hash = crypto.createHash('sha512');
    hash.update(password, 'utf8');

    return hash.digest('base64');
};
//console.log(app.getHash("345234523452345"));

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
app.promos = {};
loadFromJSONFile(app.promos, path.join(__dirname, 'promos.txt'));
app.usePromo = function(promo){
    var ans = null;
    if (app.promos.hasOwnProperty(promo) && app.promos[promo] == true) {

        //delete app.promos[promo];
        app.promos[promo] = false;

        var fs = require('fs');

        var filePath = path.join(__dirname, 'promos.txt');
        try {
            var filedata = fs.readFileSync(filePath, {encoding: "utf8"});
            // some hack with first symbol =/
            filedata = filedata.replace(/^\uFEFF/, '');
            // parsing file to JSON object
            var jsondata = JSON.parse(filedata);

            if (jsondata) {
                //delete jsondata[promo];
                jsondata[promo] = false;

                fs.writeFileSync(filePath, JSON.stringify(jsondata));

                ans = true;
            } else {
                console.log('No json data in file');
            }
        } catch (e) {
            console.log("error:", e);
        }
    } else {
        console.log('This promo already used', promo);
    }

    return ans;
};
app.generatePromos = function(promosCount){
    function makeid(length)
    {
        var text = "";
        var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        var firstPossible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

        for( var i=0; i < length; i++ ) {
            if (i != 0)
                text += possible.charAt(Math.floor(Math.random() * possible.length));
            else
                text += firstPossible.charAt(Math.floor(Math.random() * firstPossible.length));
        }
        return text;
    }

    var ans = null;

    var promoCodes = {};
    var promosGenerated = true;
    for (var i = 0; i < promosCount; i++){

        var promo = makeid(16).toString();
        var isNewPromo = true;
        for (var j = 0; j < 10; j++) {
            if (promoCodes.hasOwnProperty(promo) || app.promos.hasOwnProperty(promo)) {
                isNewPromo = false;
            } else {
                isNewPromo = true;
                break;
            }
        }
        if (isNewPromo) {
            promoCodes[promo] = true;
        } else {
            console.error("something is really bad with app.promos or generator");
            promosGenerated = false;
        }
    }

    if (promosGenerated){
        for (var pr in promoCodes) {
            if (promoCodes.hasOwnProperty(pr)){
                app.promos[pr] = true;
            }
        }

        var fs = require('fs');

        var filePath = path.join(__dirname, 'promos.txt');
        try {
            var filedata = fs.readFileSync(filePath, {encoding: "utf8"});
            // some hack with first symbol =/
            filedata = filedata.replace(/^\uFEFF/, '');
            // parsing file to JSON object
            var jsondata = JSON.parse(filedata);

            if (jsondata) {
                for (var pr in promoCodes) {
                    if (promoCodes.hasOwnProperty(pr)){
                        jsondata[pr] = true;
                    }
                }

                fs.writeFileSync(filePath, JSON.stringify(jsondata));

                ans = true;
            } else {
                console.log('No json data in file');
            }
        } catch (e) {
            console.log("error:", e);
        }
    } else {
        console.error("promos aren't generated");
    }
    return ans;
};
app.findUser = function(login, password){
    var user = null;
    if (app.users.hasOwnProperty(login)){
        var userPassword = app.users[login];
        //if (userPassword == password) {
        // encryption
        if (userPassword == app.getHash(password+login)) {
            user = {name: login};
        }
    }
    return user;
};
app.newUser = function(login, password, promo){
    var ans = null;
    if (app.users.hasOwnProperty(login)) {
        console.log("login already exist");
    } else {
        function addUser(){
            // encryption
            var passwordToFind = password;
            password = app.getHash(password + login);

            app.users[login] = password;

            var fs = require('fs');

            var filePath = path.join(__dirname, 'users.txt');
            try {
                var filedata = fs.readFileSync(filePath, {encoding: "utf8"});
                // some hack with first symbol =/
                filedata = filedata.replace(/^\uFEFF/, '');
                // parsing file to JSON object
                var jsondata = JSON.parse(filedata);

                if (jsondata) {
                    jsondata[login] = password;

                    fs.writeFileSync(filePath, JSON.stringify(jsondata));
                } else {
                    console.log('No json data in file');
                }
            } catch (e) {
                console.log("error:", e);
            }

            return app.findUser(login, passwordToFind);
        }

        if (promo) {
            if (app.usePromo(promo)) {
                ans = addUser();
                console.log("ans", ans);
            } else {
                console.log('Using of promo failed');
            }
        } else {
            ans = addUser();
        }
    }

    return ans;
};
//app.generatePromos(20);

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
            //error: err
            error: {}
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