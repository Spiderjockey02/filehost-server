import type { createCronJobParams, createCronJobLogTypeParams } from '@/types/database/CronJob';
import type { CronJob, CronJobLog, CronJobNames } from '@/types/generated/client';
import client from './prisma';

export default class CronJobAccessor {
	names: Map<CronJobNames, CronJob>;

	constructor() {
		this.names = new Map();
	}

	/**
	  * Create a new CRON job
	  * @param {createCronJobParams} data The data to make one
	  * @returns {CronJob} The new CRON job
	*/
	async create(data: createCronJobParams): Promise<CronJob> {
		return client.cronJob.create({
			data,
		});
	}

	/**
	  * Update an existing CRON job
	  * @param {createCronJobParams} data The data to make one
	  * @returns {CronJob} The updated CRON job
	*/
	async update(data: createCronJobParams): Promise<CronJob> {
		return client.cronJob.update({
			where: {
				name: data.name,
			},
			data: {
				schedule: data.schedule,
				latestStatus: data.latestStatus,
			},
		});
	}

	/**
	  * Fetch all CRON jobs for running
	  * @returns {CronJob[]} The CRON jobs
	*/
	async fetchAll(): Promise<CronJob[]> {
		try {
			const cronJobs = await client.cronJob.findMany();
			for (const cronJob of cronJobs) this.names.set(cronJob.name, cronJob);

			return cronJobs;
		} catch (err) {
			throw err;
		}
	}

	/**
	  * Create a CRON job log
	  * @param {createCronJobLogTypeParams} data The CRON job log data
	  * @returns {CronJobLog} The CRON job log.
	*/
	async createLog(data: createCronJobLogTypeParams): Promise<CronJobLog> {
		try {
			const log = await client.cronJobLog.create({
				data: {
					cronJob: {
						connectOrCreate: {
							where: {
								name: data.jobName,
							},
							create: {
								name: data.jobName,
							},
						},
					},
					status: data.status,
					message: data.message,
					duration: data.duration,
				},
			});

			// Update latest status
			await this.update({ name: data.jobName, latestStatus: data.status });
			return log;
		} catch (err) {
			throw err;
		}
	}

	/**
	  * Fetch all CRON job logs by name
		* @returns {CronJobLog[]} An array of CRON job logs
	*/
	async fetchAllLogs(jobName: CronJobNames): Promise<CronJobLog[]> {
		return client.cronJobLog.findMany({
			where: {
				jobName,
			},
		});
	}
}