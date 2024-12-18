import chalk from 'chalk';
import moment from 'moment';
import { createRollingFileLogger } from 'simple-node-logger';
import type { loggerTypes, customRequest, customResponse } from '../types';
import onFinished from 'on-finished';
import { getIP } from '../middleware';
const log = createRollingFileLogger({
	logDirectory: './src/utils/logs',
	fileNamePattern: 'roll-<DATE>.log',
	dateFormat: 'YYYY.MM.DD',
});


export default class Logger {
	log(content: unknown, type: loggerTypes = 'log') {
		const timestamp = `[${moment().format('HH:mm:ss:SSS')}]:`;
		switch (type) {
			case 'log':
				log.info(content);
				console.log(`${timestamp} ${chalk.bgBlue(type.toUpperCase())} ${content} `);
				break;
			case 'warn':
				log.warn(content);
				console.log(`${timestamp} ${chalk.black.bgYellow(type.toUpperCase())} ${content} `);
				break;
			case 'error':
				log.error(content);
				console.log(`${timestamp} ${chalk.bgRed(type.toUpperCase())} ${content} `);
				break;
			case 'debug':
				if (!process.env.debug) return;
				log.debug(content);
				console.log(`${timestamp} ${chalk.green(type.toUpperCase())} ${content} `);
				break;
			case 'ready':
				log.info(content);
				console.log(`${timestamp} ${chalk.black.bgGreen(type.toUpperCase())} ${content}`);
				break;
			default:
				break;
		}
	}

	ready(content: string) {
		this.log(content, 'ready');
	}

	warn(content: string) {
		this.log(content, 'warn');
	}

	error(content: unknown) {
		this.log(content, 'error');
	}

	debug(content: string) {
		this.log(content, 'debug');
	}

	async connection(req: customRequest, res: customResponse) {
		// Update request
		await new Promise((resolve) => {
			onFinished(req, function() {
				req._endTime = new Date().getTime();
				resolve('');
			});
		});

		// Update response
		await new Promise((resolve) => {
			onFinished(res, function() {
				res._endTime = new Date().getTime();
				resolve('');
			});
		});

		// Get additional information
		const	method = req.method,
			url = req.originalUrl || req.url,
			status = res.statusCode,
			color = status >= 500 ? 'bgRed' : status >= 400 ? 'bgMagenta' : status >= 300 ? 'bgCyan' : status >= 200 ? 'bgGreen' : 'dim',
			requester = getIP(req);

		// How long did it take for the page to load
		let response_time;
		if (res._endTime && req._endTime) response_time = (res._endTime + req._endTime) - (res._startTime + req._startTime);

		if (['bgCyan', 'bgGreen', 'dim'].includes(color)) {
			this.log(`${requester} ${method} ${url} ${chalk[color](status)} - ${(response_time ?? '?')} ms`, 'log');
		} else if (color == 'bgMagenta') {
			this.warn(`${requester} ${method} ${url} ${chalk[color](status)} - ${(response_time ?? '?')} ms`);
		} else {
			this.error(`${requester} ${method} ${url} ${chalk[color](status)} - ${(response_time ?? '?')} ms`);
		}

	}
}
