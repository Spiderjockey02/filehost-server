import type { CronJobNames, Status } from '@/types/generated/client';

export interface createCronJobLogTypeParams {
  jobName: CronJobNames
  status: Status
  message: string
  duration: number
}

export interface createCronJobParams {
	name: CronJobNames
	schedule?: string
  latestStatus?: Status
}

export interface CronJobList {
  name: CronJobNames
  schedule: string
}