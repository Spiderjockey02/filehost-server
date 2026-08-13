import type { CronJobNames, Status } from '@/types/generated/client';

export interface CreateCronJobLogTypeParams {
  jobName: CronJobNames
  status: Status
  message: string
  duration: number
}

export interface CreateCronJobParams {
	name: CronJobNames
	schedule: string
  latestStatus?: Status | undefined
}

export interface CronJobList {
  name: CronJobNames
  schedule: string
}

export interface UpdateCronJobParams {
  name: CronJobNames
	schedule?: string | undefined
  latestStatus?: Status | undefined
}