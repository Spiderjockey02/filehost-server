import chalk from 'chalk';
import moment from 'moment';
type loggerTypes = 'log' | 'warn' | 'error' | 'debug' | 'ready'

export default class Logger {
	public static log(content: string, type: loggerTypes = 'log') {
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
				if (!process.env.debug) return;
				console.log(`${timestamp} ${chalk.green(type.toUpperCase())} ${content} `);
				break;
			case 'ready':
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
}
