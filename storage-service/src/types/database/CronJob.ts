import { CronJobNames, Status } from '@/types/generated/client';

export interface createCronJobLogType {
  jobName: CronJobNames
  status: Status
  message: string
  duration: number
}

export interface createCronJob {
	name: CronJobNames
	schedule?: string
  latestStatus?: Status
}

export interface CronJobList {
  name: CronJobNames
  schedule: string
}