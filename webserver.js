require('./console')();
var express = require('express'),
    app = express(),
    argv = require('yargs').argv,
    os = require('os'),
    port = parseInt(argv.port, 10) || 8082,
    logger = require('morgan'),
    moment = require('moment'),
    bytes = require('bytes');

if (port < 1) {
    console.error('invalid port');
    return;
}
app.set('port', process.env.PORT || port);
var server = app.listen(app.get('port'));

logger.format('custom', function(tokens, req, res) {
    var date = moment(new Date()).format('YYYY-MM-DD HH:mm:ss Z'),
        len = parseInt(res.getHeader('Content-Length'), 10),
        responseTime = (new Date() - req._startTime),
        s_statusCode = res.statusCode;

    len = isNaN(len) ? '' : len = bytes(len);
    if (res.statusCode == 200) s_statusCode = res.statusCode.toString().green;
    else if (res.statusCode == 304) s_statusCode = res.statusCode.toString().cyan;
    else if (res.statusCode >= 400) s_statusCode = res.statusCode.toString().red;
    return '[' + date.grey + ']' + ' ' + req.method + ' ' + s_statusCode + ' ' + (req.originalUrl || req.url) + ' ' + (responseTime + 'ms ').magenta + len.yellow;
});
app.use(logger('custom', {
    skip: false
}));
app.use('/', express.static(__dirname + '/example'));


var ifaces = os.networkInterfaces();
var printDetails = function(details) {
    if (details.family == 'IPv4' && dev.indexOf('lo') === -1) {
        console.log('webserver running on http://' + details.address + ':' + port);
    }
};
for (var dev in ifaces) {
    ifaces[dev].forEach(printDetails);
}