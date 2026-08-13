import type { loggerTypes, customRequest, customResponse } from '@/types';
import { createRollingFileLogger } from 'simple-node-logger';
import onFinished from 'on-finished';
import { getIP } from './';
import pino from 'pino';

const fileLogger = createRollingFileLogger({
	logDirectory: './src/utils/logs',
	fileNamePattern: 'roll-<DATE>.log',
	dateFormat: 'YYYY.MM.DD',
});

const baseLogger = pino({
	level: 'debug',
	formatters: {
		level(label) {
			return { level: label };
		},
	},
	timestamp: pino.stdTimeFunctions.isoTime,
	transport: {
		target: 'pino-pretty',
		options: {
			colorize: true,
			ignore: 'pid,hostname',
		},
	},
});

export default class Logger {
	private logger = baseLogger;

	api = this.logger.child({ source: 'api' });
	db = this.logger.child({ source: 'database' });

	log(content: unknown, type: loggerTypes = 'log') {
		switch (type) {
			case 'ready':
			case 'log':
				this.logger.info(content);
				fileLogger.info(content);
				break;
			case 'warn':
				this.logger.warn(content);
				fileLogger.warn(content);
				break;
			case 'error':
				this.logger.error(content);
				fileLogger.error(content);
				break;
			case 'debug':
				if (!process.env['DEBUG']) return;
				this.logger.debug(content);
				fileLogger.debug(content);
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
			requester = getIP(req);

		// How long did it take for the page to load
		let response_time;
		if (res._endTime && req._endTime) response_time = (res._endTime + req._endTime) - (res._startTime + req._startTime);

		const message = `${requester} ${method} ${url} ${status} - ${response_time ?? '?'} ms`;
		if (status >= 500) this.error(message);
		else if (status >= 400) this.warn(message);
		else this.log(message, 'log');
	}
}
