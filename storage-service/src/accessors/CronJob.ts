import type { createCronJob, createCronJobLogType } from '@/types/database/CronJob';
import type { CronJob, CronJobLog, CronJobNames } from '@/types/generated/client';
import client from './prisma';

export default class CronJobAccessor {
	names: Map<CronJobNames, CronJob>;

	constructor() {
		this.names = new Map();
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
		} catch (error) {
			throw error;
		}
	}

	/**
	  * Create a new CRON job
	  * @param {createCronJob} data The data to make one
	  * @returns The new CRON job
	*/
	async create(data: createCronJob) {
		return client.cronJob.create({
			data,
		});
	}

	/**
	  * Update an existing CRON job
	  * @param {createCronJob} data The data to make one
	  * @returns The new CRON job
	*/
	async update(data: createCronJob) {
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
	  * Modify the storage size of a user
	  * @param {createCronJobLogType} data The ID of the user
	  * @returns The updated user.
	*/
	async createLog(data: createCronJobLogType) {
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

			// Update latest status and then return the inital log
			await this.update({ name: data.jobName, latestStatus: data.status });
			return log;
		} catch (error) {
			throw error;
		}
	}

	/**
	  * Fetch all CRON job logs
		* @returns {CronJobLog[]} An array of CRON job logs
	*/
	async fetchAllLogs(): Promise<CronJobLog[]> {
		return client.cronJobLog.findMany();
	}
}