import { Status } from '@prisma/client';

export interface createCronJobLogType {
  jobName: string
  status: Status
  message: string
  duration: number
}


export interface createCronJob {
	name: string
	schedule?: string
  latestStatus?: Status
}