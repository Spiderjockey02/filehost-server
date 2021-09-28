// Dependencies
const chalk = require('chalk'),
	onFinished = require('on-finished'),
	moment = require('moment');

// Logger
exports.log = (content, type = 'log') => {
	if (content == 'error') return;
	const timestamp = `[${moment().format('HH:mm:ss:SSS')}]:`;
	switch (type) {
	case 'log':
		console.log(`${timestamp} ${chalk.bgBlue(type.toUpperCase())} ${content} `);
		break;
	case 'warn':
		console.log(`${timestamp} ${chalk.black.bgYellow(type.toUpperCase())} ${content} `);
		break;
	case 'error':
		console.log(`${timestamp} ${chalk.bgRed(type.toUpperCase())} ${content} `);
		break;
	case 'debug':
		console.log(`${timestamp} ${chalk.green(type.toUpperCase())} ${content} `);
		break;
	case 'cmd':
		console.log(`${timestamp} ${chalk.black.bgWhite(type.toUpperCase())} ${content}`);
		break;
	case 'ready':
		console.log(`${timestamp} ${chalk.black.bgGreen(type.toUpperCase())} ${content}`);
		break;
	default:
		break;
	}
};

exports.connection = async (req, res) => {
	req._startTime = new Date().getTime();
	req._endTime = undefined;

	// response data
	res._startTime = new Date().getTime();
	res._endTime = undefined;

	onFinished(req, function() {
		req._endTime = new Date().getTime();
		onFinished(res, function() {
			res._endTime = new Date().getTime();

			// Get additional information
			const	method = req.method,
				url = req.originalUrl || req.url,
				status = res.statusCode,
				color = status >= 500 ? 'bgRed' : status >= 400 ? 'bgMagenta' : status >= 300 ? 'bgCyan' : status >= 200 ? 'bgGreen' : 'dim',
				requester = getIP(req);

			// How long did it take for the page to load
			let response_time;
			if (res._endTime && req._endTime) response_time = (res._endTime + req._endTime) - (res._startTime + req._startTime);

			// log
			if ((url.startsWith('/js') || url.startsWith('/css'))) {
				if (require('../config').debug) return require('./logger').log(`${requester} ${method} ${url} ${chalk[color](status)} - ${(response_time ?? '?')} ms`, 'debug');
				return;
			}
			require('./logger').log(`${requester} ${method} ${url} ${chalk[color](status)} - ${(response_time ?? '?')} ms`, 'log');
		});
	});
};

// get the IP of the client
function getIP(req) {
	return req.ip ||
    req._remoteAddress ||
    (req.connection && req.connection.remoteAddress) ||
    undefined;
}
