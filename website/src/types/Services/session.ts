import type { User } from '@/types/generated/browser';
import type { Session } from 'better-auth/types';

export interface GetSessionResult {
  user: User;
  session: Session;
};

export type CurrentSessionResult = | {
  isLoggedin: true;
  user: User;
  session: Session;
  isAdmin: boolean;
} | {
  isLoggedin: false;
  user: null;
  session: null;
  isAdmin: false;
};

type accountDetails = {
  id: string
  provider: string
}

export interface GetSessionAccountsResults {
  accounts: accountDetails[]
}