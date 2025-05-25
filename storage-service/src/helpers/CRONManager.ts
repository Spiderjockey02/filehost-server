import Client from './Client';
import { CronJob } from 'cron';
import CronJobAccessor from '../accessors/CronJob';
import extendedClient from '../accessors/prisma';
import { CONSTANTS } from '../utils/CONSTANTS';
import fs from 'fs/promises';
import { CronJobLog } from '@prisma/client';

export default class CRONManager extends CronJobAccessor {
	client: Client;

	constructor(client: Client) {
		super();
		this.client = client;

		this.setupCRONJobs();
	}

	/**
	  * Setup and initalise the CRON job manager
	*/
	private async setupCRONJobs() {
		await this.fetchAllCronJobs();

		// First ensure all CRON jobs exist on the database (Could be first time setup)
		if ([...this.names.keys()].length == 0) {
			await Promise.all([
				this.createCronJob({ name: 'BACKED_UP_DATABASE', schedule: '0 2 * * *' }),
				this.createCronJob({ name: 'DELETE_OLD_LOG_FILES', schedule: '0 3 * * *' }),
				this.createCronJob({ name: 'DELETE_EXPIRED_SESSIONS', schedule: '0 * * * *' }),
			]);
		}

		// Second start the scheduling
		for (const [name, cronJob] of this.names.entries()) {
			switch (name) {
				case 'BACKED_UP_DATABASE':
					this.scheduleJob(cronJob.schedule, this.backupDatabase.bind(this));
					break;
				case 'DELETE_OLD_LOG_FILES':
					this.scheduleJob(cronJob.schedule, this.deleteOldLogFiles.bind(this));
					break;
				case 'DELETE_EXPIRED_SESSIONS':
					this.scheduleJob(cronJob.schedule, this.deleteExpiredSessions.bind(this));
					break;
				default:
					this.client.logger.error(`[CRONMANAGER]: ${name} is not a valid CRON job.`);
			}
		}
	}

	/**
	  * Setup scheduling for a CRON job
	  * @param {string} cronExpr The CRON schedule expression
		* @param {Function} handler The function to run
	  * @returns The updated user.
	*/
	private scheduleJob(cronExpr: string, handler: () => Promise<CronJobLog | null>) {
		CronJob.from({
			cronTime: cronExpr,
			onTick: async () => {
				await handler();
			},
			start: true,
		});
	}


	/**
	  * Backup the database
		* @returns {CronJobLog}
	*/
	async backupDatabase(): Promise<CronJobLog> {
		const start = Date.now();

		try {
			const metadata = await extendedClient.$backup();

			const duration = Date.now() - start;
			return this.createCronJobLog({ jobName: 'BACKED_UP_DATABASE', status: 'SUCCESS', message: `File name: ${metadata.filename}, Size: ${metadata.sizeBytes}`, duration });
		} catch (err) {
			const duration = Date.now() - start;
			return this.createCronJobLog({ jobName: 'BACKED_UP_DATABASE', status: 'FAILURE', message: `${err}`, duration });
		}
	}

	/**
	  * Delete old log files
		* @returns {CronJobLog}
	*/
	async deleteOldLogFiles(): Promise<CronJobLog> {
		const oldestDateToKeepFile = new Date(Date.now() - 1000 * 60 * 60 * 24 * CONSTANTS.RETENTION_POLICY_FOR_LOG_FILES_IN_DAYS);
		const start = Date.now();

		try {
			const logs = await fs.readdir(`${process.cwd()}/src/utils/logs`);
			let deleteNum = 0;
			for (const file of logs) {
				const stats = await fs.stat(`${process.cwd()}/src/utils/logs/${file}`);
				// Check when it was last modified
				if (stats.ctimeMs < oldestDateToKeepFile.getTime()) {
					deleteNum++;
					fs.unlink(`${process.cwd()}/src/utils/logs/${file}`);
				}
			}

			const duration = Date.now() - start;
			return this.createCronJobLog({ jobName: 'DELETE_OLD_LOG_FILES', status: 'SUCCESS', message: `Deleted ${deleteNum} log files.`, duration });
		} catch (err) {
			const duration = Date.now() - start;
			return this.createCronJobLog({ jobName: 'DELETE_OLD_LOG_FILES', status: 'FAILURE', message: `${err}`, duration });
		}
	}

	/**
	  * Delete expired sessions
		* @returns {CronJobLog}
	*/
	async deleteExpiredSessions(): Promise<CronJobLog | null> {
		const start = Date.now();

		try {
			const { count } = await this.client.sessionManager.deleteExpired();
			if (count == 0) return null;

			const duration = Date.now() - start;
			return this.createCronJobLog({ jobName: 'DELETE_EXPIRED_SESSIONS', status: 'SUCCESS', message: `Deleted ${count} expired sessions.`, duration });
		} catch (err) {
			const duration = Date.now() - start;
			return this.createCronJobLog({ jobName: 'DELETE_EXPIRED_SESSIONS', status: 'FAILURE', message: `${err}`, duration });
		}
	}
}