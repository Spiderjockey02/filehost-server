import { UserAgentWithCounts } from '../database';
import { Plan } from '../generated/browser';

export type statResponse = {
  totalUsers: { total: number },
  totalUsage: number,
  totalFileCount: number
}

export type plansResponse = {
  plans: Plan[]
}

export type AdminNetworkUserAgentsListResult = {
  agents: UserAgentWithCounts[];
  total: number;
};