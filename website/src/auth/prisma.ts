import { PrismaClient } from '@prisma/client';

const client = new PrismaClient({ errorFormat: 'pretty',
	log: [
		{ level: 'info', emit: 'event' },
		{ level: 'warn', emit: 'event' },
		{ level: 'error', emit: 'event' },
	],
});

const extendedClient = client.$extends({
	query: {
		user: {
			async create({ args, query }) {

				if (!args.data.storageId) {
					args.data.storage = {
						connect: { id: args.data.storageId },
					};
					args.data.plan = {
						connect: { id: args.data.planId },
					};
				}
				const result = await query(args);
				return convertBigIntToNumber(result);
			},
		},
		async $allOperations({ args, query }) {
			const result = await query(args);
			return convertBigIntToNumber(result);
		},
	},
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

export default extendedClient;