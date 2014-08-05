/**
 * Created by yarvyk on 05.08.2014.
 */

// the middleware function
module.exports = function() {

    return function(req, res, next) {
        //http://jsperf.com/stackoverflow-for-vs-hasownproperty/2
        if (req.app.banned[req.connection.remoteAddress] !== undefined) {
        //if (req.app.banned.hasOwnProperty(req.connection.remoteAddress)) {
            console.log(req.connection.remoteAddress, "from ban list");
            res.end('Banned');
        }
        else { next(); }
    }

};