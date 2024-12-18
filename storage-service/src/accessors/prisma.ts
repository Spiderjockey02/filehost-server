import { PrismaClient } from '@prisma/client';
import { Logger } from '../utils';
const LoggerClass = new Logger();

const client = new PrismaClient({ errorFormat: 'pretty',
	log: [
		{ level: 'info', emit: 'event' },
		{ level: 'warn', emit: 'event' },
		{ level: 'error', emit: 'event' },
	],
});

client.$use(async (params, next) => {
	const startTime = Date.now(),
		result = await next(params),
		timeTook = Date.now() - startTime;

	LoggerClass.debug(`Query ${params.model}.${params.action} took ${timeTook}ms`);

	return result;
});

client.$on('info', (data) => {
	LoggerClass.log(data.message);
});

client.$on('warn', (data) => {
	LoggerClass.warn(data.message);
});

client.$on('error', (data) => {
	LoggerClass.error(data.message);
});

export default client;
