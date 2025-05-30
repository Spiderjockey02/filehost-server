import { PrismaClient } from '@prisma/client';
import { Logger, parseMySQLConnectionString, PATHS } from '../utils';
import { exec } from 'child_process';
import { existsSync } from 'fs';
import fs from 'fs/promises';
import { DatabaseMetadata } from 'src/types';
const LoggerClass = new Logger();

const client = new PrismaClient({ errorFormat: 'pretty',
	log: [
		{ level: 'info', emit: 'event' },
		{ level: 'warn', emit: 'event' },
		{ level: 'error', emit: 'event' },
	],
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

const prismaClient = client.$extends({
	query: {
		$allModels: {
			async $allOperations({ model, operation, args, query }) {
				const startTime = Date.now();
				const result = await query(args);
				const timeTook = Date.now() - startTime;

				LoggerClass.debug(`Query ${model}.${operation} took ${timeTook}ms`);
				return result;
			},
		},
	},
	client: {
		async $backup(): Promise<DatabaseMetadata> {
			// Check if the database backups folder exists
			if (!existsSync(PATHS.DATABASE_BACKUPS)) await fs.mkdir(PATHS.DATABASE_BACKUPS, { recursive: true });

			const mysqlArgs = parseMySQLConnectionString(process.env.DATABASE_URL as string);
			const timestamp = new Date();

			return new Promise((resolve, reject) => {
				exec(`mysqldump -u ${mysqlArgs.username} -p${mysqlArgs.password} -n ${mysqlArgs.database} > "${PATHS.DATABASE_BACKUPS}/${timestamp.getTime()}.dump.sql"`, async (err) => {
					const metadata = {
						createdAt: timestamp.toISOString(),
						filename: `${timestamp.getTime()}.dump.sql`,
						status: err ? 'failed' : 'success',
						sizeBytes: err ? null : await fs.stat(`${PATHS.DATABASE_BACKUPS}/${timestamp.getTime()}.dump.sql`).then((stats) => stats.size),
						errorMessage: err ? err.message : null,
						db: mysqlArgs.database,
					};

					if (err) reject(err);
					await fs.writeFile(`${PATHS.DATABASE_BACKUPS}/${timestamp.getTime()}.meta.json`, JSON.stringify(metadata, null, 2));
					resolve(metadata);
				});
			});
		},
	},
});

export default prismaClient;