// Dependencies
const chalk = require('chalk'),
	moment = require('moment');

// Logger
exports.log = (req, res) => {
	const timestamp = `[${moment().format('HH:mm:ss:SSS')}]:`,
		method = req.method,
		url = req.originalUrl || req.url,
		status = res.statusCode,
		color = status >= 500 ? 'bgRed' : status >= 400 ? 'bgYellow' : status >= 300 ? 'bgCyan' : status >= 200 ? 'bgGreen' : 'dim',
		requester = (req.connection.remoteAddress == '::1') ? '127.0.0.1' : req.connection.remoteAddress.slice(7);

	// How long did it take for the page to load
	let response_time;
	if (res._startAt && req._startAt) {
		response_time = ((res._startAt[0] - req._startAt[0]) * 1e3 + (res._startAt[1] - req._startAt[1]) * 1e-6).toFixed(3) ?? 0;
	}

	// log
	console.log(`${timestamp} ${requester} ${method} ${url} ${chalk[color](status)} - ${(response_time ?? '?')} ms`);
};
