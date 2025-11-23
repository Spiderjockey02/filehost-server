import type { CronJobLog, CronJobNames } from '@/types/generated/client';
import type { CronJobList } from '@/types/database/CronJob';
import CronJobAccessor from '@/accessors/CronJob';
import extendedClient from '@/accessors/prisma';
import type Client from './Client';
import { CronJob } from 'cron';
import fs from 'fs/promises';

export default class CRONManager extends CronJobAccessor {
	client: Client;
	private activeJobs: Map<string, CronJob>;

	constructor(client: Client) {
		super();
		this.client = client;
		this.activeJobs = new Map();
		this.setupCRONJobs();
	}

	/**
	  * Setup and initalise the CRON job manager
	*/
	private async setupCRONJobs() {
		await this.fetchAll();

		const defaultJobs = [
			{ name: 'BACKED_UP_DATABASE', schedule: '0 2 * * *' },
			{ name: 'DELETE_OLD_BACKUPS', schedule: '0 4 * * *' },
			{ name: 'DELETE_OLD_LOG_FILES', schedule: '0 3 * * *' },
			{ name: 'DELETE_EXPIRED_SESSIONS', schedule: '0 * * * *' },
			{ name: 'RECALCULATE_USER_STORAGE', schedule: '0 0,6,12,18 * * *' },
			{ name: 'RECALCULATE_STORAGE_USAGE', schedule: '0 * * * *' },
		] as CronJobList[];

		for (const job of defaultJobs) {
			if (!this.names.has(job.name)) {
				try {
					await this.create(job);
				} catch (error) {
					this.client.logger.error(`[CRONMANAGER]: Failed to create CRON job ${job.name}: ${error}`);
				}
			}
		}

		this.loadCRONJobs();
	}

	private loadCRONJobs() {
		// Second start the scheduling
		for (const [name, cronJob] of this.names.entries()) {
			switch (name) {
				case 'BACKED_UP_DATABASE':
					this.scheduleJob(name, cronJob.schedule, this.backupDatabase.bind(this));
					break;
				case 'DELETE_OLD_LOG_FILES':
					this.scheduleJob(name, cronJob.schedule, this.deleteOldLogFiles.bind(this));
					break;
				case 'DELETE_EXPIRED_SESSIONS':
					this.scheduleJob(name, cronJob.schedule, this.deleteExpiredSessions.bind(this));
					break;
				case 'RECALCULATE_USER_STORAGE':
					this.scheduleJob(name, cronJob.schedule, this.recalculateUserStorage.bind(this));
					break;
				case 'RECALCULATE_STORAGE_USAGE':
					this.scheduleJob(name, cronJob.schedule, this.recalculateStorageUsage.bind(this));
					break;
				case 'DELETE_OLD_BACKUPS':
					this.scheduleJob(name, cronJob.schedule, this.deleteOldBackups.bind(this));
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
	private scheduleJob(name: string, cronExpr: string, handler: () => Promise<CronJobLog>) {
		// Check if it's already active (Might have been called due to a schedule being updated)
		const existingJob = this.activeJobs.get(name);
		if (existingJob) {
			existingJob.stop();
			this.activeJobs.delete(name);
		}

		// Create the new CRON job
		const job = CronJob.from({
			cronTime: cronExpr,
			onTick: async () => {
				try {
					const log = await handler();

					if (log.status == 'FAILURE') throw log.message;
					this.client.QueueManager.addToQueue('AUDIT_LOGS', async () => {
						await this.client.AuditLogManager.create({
							eventName: 'CRONJOB_RAN',
							resourceType: 'SYSTEM',
							resourceId: name,
							success: true,
							message: `CRON job ${name} executed successfully.`,
						});
					});
				} catch (err) {
					this.client.QueueManager.addToQueue('AUDIT_LOGS', async () => {
						await this.client.AuditLogManager.create({
							eventName: 'CRONJOB_RAN',
							resourceType: 'SYSTEM',
							resourceId: name,
							success: false,
							message: `CRON job ${name} failed with error: ${err}`,
						});
					});
					this.client.logger.error(`[CRONMANAGER]: Error occurred while executing ${name}: ${err}`);
				}
			},
			start: true,
		});
		this.activeJobs.set(name, job);
	}

	/**
	 * Update the schedule of a CRON job and reschedule it
	 * @param {CronJobNames} name The name of the CRON job
	 * @param {string} newSchedule The new CRON schedule expression
	*/
	async updateAndReschedule(name: CronJobNames, newSchedule: string) {
		// Check if name is valid
		const job = this.activeJobs.get(name);
		if (job == undefined) throw new Error(`CRON job: ${name} is not an active job.`);

		// Update and reload CRON jobs
		await this.update({ name, schedule: newSchedule });
		this.loadCRONJobs();
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
			return this.createLog({ jobName: 'BACKED_UP_DATABASE', status: 'SUCCESS', message: `File name: ${metadata.filename}, Size: ${metadata.sizeBytes}`, duration });
		} catch (err) {
			const duration = Date.now() - start;
			return this.createLog({ jobName: 'BACKED_UP_DATABASE', status: 'FAILURE', message: `${err}`, duration });
		}
	}

	/**
	  * Delete old database backup files
		* @returns {CronJobLog}
	*/
	async deleteOldBackups(): Promise<CronJobLog> {
		const oldestDateToKeepBackup = new Date(Date.now() - 1000 * 60 * 60 * 24 * this.client.config.get('RETENTION_POLICY_IN_DAYS.DATABASE_FILES'));
		const start = Date.now();

		try {
			const backupPath = `${process.cwd()}/prisma/backups`;
			const backups = await fs.readdir(backupPath);
			let deleteNum = 0;

			for (const file of backups) {
				const stats = await fs.stat(`${backupPath}/${file}`);
				// Check when it was last modified
				if (stats.ctimeMs < oldestDateToKeepBackup.getTime()) {
					deleteNum++;
					fs.unlink(`${backupPath}/${file}`);
				}
			}

			const duration = Date.now() - start;
			return this.createLog({ jobName: 'DELETE_OLD_BACKUPS', status: 'SUCCESS', message: `Deleted ${deleteNum / 2} old backup files.`, duration });
		} catch (err) {
			const duration = Date.now() - start;
			return this.createLog({ jobName: 'DELETE_OLD_BACKUPS', status: 'FAILURE', message: `${err}`, duration });
		}
	}


	/**
	  * Delete old log files
		* @returns {CronJobLog}
	*/
	async deleteOldLogFiles(): Promise<CronJobLog> {
		const oldestDateToKeepFile = new Date(Date.now() - 1000 * 60 * 60 * 24 * this.client.config.get('RETENTION_POLICY_IN_DAYS.LOG_FILES'));
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
			return this.createLog({ jobName: 'DELETE_OLD_LOG_FILES', status: 'SUCCESS', message: `Deleted ${deleteNum} log files.`, duration });
		} catch (err) {
			const duration = Date.now() - start;
			return this.createLog({ jobName: 'DELETE_OLD_LOG_FILES', status: 'FAILURE', message: `${err}`, duration });
		}
	}

	/**
	  * Delete expired sessions
		* @returns {CronJobLog}
	*/
	async deleteExpiredSessions(): Promise<CronJobLog> {
		const start = Date.now();

		try {
			const { count } = await this.client.sessionManager.deleteExpired();
			if (count == 0) return this.createLog({ jobName: 'DELETE_EXPIRED_SESSIONS', status: 'SUCCESS', message: 'No expired sessions found.', duration: 0 });

			const duration = Date.now() - start;
			return this.createLog({ jobName: 'DELETE_EXPIRED_SESSIONS', status: 'SUCCESS', message: `Deleted ${count} expired sessions.`, duration });
		} catch (err) {
			const duration = Date.now() - start;
			return this.createLog({ jobName: 'DELETE_EXPIRED_SESSIONS', status: 'FAILURE', message: `${err}`, duration });
		}
	}

	/**
	  * Recalculate user storage sizes
		* @returns {CronJobLog}
	*/
	async recalculateUserStorage(): Promise<CronJobLog> {
		const start = Date.now();

		try {
			const users = await this.client.userManager.fetchAll({});
			let updatedNum = 0;
			for (const user of users) {
				const size = await this.client.userManager.fetchUsersTotalFileSize(user.id);
				if (size._sum.size !== user.totalStorageSize) {
					await this.client.userManager.modifyStorageSize(user.id, size._sum.size ?? 0n, 'SET');
					updatedNum++;
				}
			}

			const duration = Date.now() - start;
			return this.createLog({ jobName: 'RECALCULATE_USER_STORAGE', status: 'SUCCESS', message: `Recalculated storage for ${updatedNum} users.`, duration });
		} catch (err) {
			const duration = Date.now() - start;
			return this.createLog({ jobName: 'RECALCULATE_USER_STORAGE', status: 'FAILURE', message: `${err}`, duration });
		}
	}

	/**
	  * Recalculate storage usage
		* @returns {CronJobLog}
	*/
	async recalculateStorageUsage(): Promise<CronJobLog> {
		const start = Date.now();

		try {
			const storages = await this.client.FileManager.storageManager.fetchAll({});
			let updatedNum = 0;
			for (const storage of storages) {
				const size = await this.client.FileManager.fetchTotalStorageUsed(storage.id);
				if (size._sum.size !== storage.maxSize) {
					await this.client.FileManager.storageManager.update({ id: storage.id, usedSize: size._sum.size ?? 0n });
					updatedNum++;
				}
			}

			const duration = Date.now() - start;
			return this.createLog({ jobName: 'RECALCULATE_STORAGE_USAGE', status: 'SUCCESS', message: `Recalculated usage for ${updatedNum} storages.`, duration });
		} catch (err) {
			const duration = Date.now() - start;
			return this.createLog({ jobName: 'RECALCULATE_STORAGE_USAGE', status: 'FAILURE', message: `${err}`, duration });
		}
	}

	isValidCronJobName(name: string): name is CronJobNames {
		return this.names.has(name as CronJobNames);
	}
}