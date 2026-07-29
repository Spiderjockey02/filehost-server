import { Logger, parseMySQLConnectionString, PATHS } from '@/utils';
// All accessor imports
import RecentlyViewedFileManager from './RecentlyViewedFile';
import { PrismaClient } from '@/types/generated/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import UserActivityAccessor from './UserActivity';
import NotificationManager from './Notification';
import type { DatabaseMetadata } from '@/types';
import AuditLogAccessor from './AuditLog';
import CronJobAccessor from './CronJob';
import StorageAccessor from './Storage';
import SessionManager from './Session';
import { exec } from 'child_process';
import PlanAccessor from './Plan';
import FileAccessor from './File';
import UserManager from './User';
import { existsSync } from 'fs';
import fs from 'fs/promises';
import 'dotenv/config';
const LoggerClass = new Logger();

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
],
adapter,
});

client.$on('info', (e) => {
	LoggerClass.log(e.message);
});

client.$on('warn', (e) => {
	LoggerClass.warn(e.message);
});

client.$on('error', (e) => {
	LoggerClass.error(e.message);
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
export {
	RecentlyViewedFileManager, UserActivityAccessor, NotificationManager, AuditLogAccessor,
	CronJobAccessor, StorageAccessor, SessionManager, PlanAccessor,
	FileAccessor, UserManager,
};