import { PrismaClient } from '@prisma/client';

const client = new PrismaClient({ errorFormat: 'pretty',
	log: [
		{ level: 'info', emit: 'event' },
		{ level: 'warn', emit: 'event' },
		{ level: 'error', emit: 'event' },
	],
});

client.$on('info', (data) => {
	console.log(data.message);
});

client.$on('warn', (data) => {
	console.warn(data.message);
});

client.$on('error', (data) => {
	console.error(data.message);
});

function convertBigIntToNumber(data: unknown): unknown {
	if (typeof data === 'bigint') return Number(data);
	if (Array.isArray(data)) return data.map((item) => convertBigIntToNumber(item));
	if (data instanceof Date) return `${data}`;
	if (data !== null && typeof data === 'object') {
		return Object.fromEntries(
			Object.entries(data).map(([key, value]) => [key, convertBigIntToNumber(value)]),
		);
	}

	return data;
}

client.$use(async (params, next) => {
	if (params.model === 'User' && params.action === 'create') {
		console.log('Original args:', params);

		// Creation needs to be overridde to set default storage and plan
		if (!params.args.data.storageId) {
			params.args.data.storage = {
				connect: { id: params.args.data.storageId },
			};
			params.args.data.plan = {
				connect: { id: params.args.data.planId },
			};
		}
	}

	const result = await next(params);
	return convertBigIntToNumber(result);
});

export default client;