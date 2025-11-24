import { parseMySQLConnectionString } from '@/utils/functions';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '@/types/generated/client';

const database = parseMySQLConnectionString(process.env.DATABASE_URL as string);
const adapter = new PrismaMariaDb({
	host: database.host,
	user: database.username,
	password: database.password,
	database: database.database,
	connectionLimit: 30,
});

const client = new PrismaClient({ log: [
	{ level: 'query', emit: 'event' },
	{ level: 'info', emit: 'event' },
	{ level: 'warn', emit: 'event' },
	{ level: 'error', emit: 'event' },
], adapter });

const extendedClient = client.$extends({
	query: {
		user: {
			async create({ args, query }) {
				args.data.storage = {
					connect: { id: args.data.storageId },
				};
				delete args.data.storageId;

				args.data.plan = {
					connect: { id: args.data.planId },
				};

				delete args.data.planId;
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