import { User } from '../utils/types';

interface Notification {
  text: string
  createdAt: Date
}


declare module 'next-auth' {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user: {
      /** The user's postal address. */
      id: string
    } & User
  }
}
