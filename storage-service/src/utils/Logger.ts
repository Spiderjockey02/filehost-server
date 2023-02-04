import chalk from 'chalk';
import moment from 'moment';
import { createRollingFileLogger } from 'simple-node-logger';
import onFinished from 'on-finished';
import { getIP } from './functions';
import type { loggerTypes } from './types';
const log = createRollingFileLogger({
	logDirectory: './src/utils/logs',
	fileNamePattern: 'roll-<DATE>.log',
	dateFormat: 'YYYY.MM.DD',
});


export class Logger {
	public static log(content: string, type: loggerTypes = 'log') {
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

	public static ready(content: string) {
		this.log(content, 'ready');
	}

	public static warn(content: string) {
		this.log(content, 'warn');
	}
	public static error(content: string) {
		this.log(content, 'error');
	}
	public static debug(content: string) {
		this.log(content, 'debug');
	}

	public static connection(req: any, res: any) {
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

				Logger.log(`${requester} ${method} ${url} ${chalk[color](status)} - ${(response_time ?? '?')} ms`, 'log');
			});
		});
	}
}
