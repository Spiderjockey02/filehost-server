import { buildDailyHistory, buildHourlyHistory, buildMonthlyHistory, buildYearlyHistory } from '@/utils/analyticTimeSeries';
import { validateBan, validateInterval, validatePage, validateString, validateUser } from '@/validators';
import type { FullSession } from '@/types/database/Session';
import type { Request, Response } from 'express';
import { Error, sanitiseObject } from '@/utils';
import type Client from '@/helpers/Client';
import { getSession } from '@/middleware';
import type { CountMap } from '@/types';

// Endpoint: GET /api/admin/users
export const getUsers = (client: Client) => {
	return async (req: Request, res: Response) => {
		try {
			const { page, name, sortBy, sortOrder, storageId } = req.query;
			const result = validateUser.safeParse({ page, name, sortBy, sortOrder, storageId });
			if (!result.success) return Error.IncorrectQuery(res, result.error.issues);

			const users = await client.userManager.fetchAll(result.data);
			const { total } = await client.userManager.fetchTotal(result.data.storageId);
			return res.json({ users: sanitiseObject(users), total });
		} catch (err) {
			client.logger.error(err);
			return Error.GenericError(res, 'Failed to fetch list of users.');
		}
	};
};

// Endpoint: GET /api/admin/users/language-codes
export const getUsersByLanguageCode = (client: Client) => {
	return async (_req: Request, res: Response) => {
		try {
			const languageCodes = await client.userManager.fetchGroupCountsByLanguageCodes();
			res.json({ languageCodes });
		} catch (err) {
			client.logger.error(err);
			Error.GenericError(res, 'Failed to fetch list of users.');
		}
	};
};


// Endpoint: GET /api/admin/users/growth
export const getUserGrowth = (client: Client) => {
	return async (req: Request, res: Response) => {
		const result = validateInterval.safeParse(req.query['interval']);
		if (!result.success) return Error.IncorrectQuery(res, result.error.issues);

		let data: CountMap = {};
		switch (result.data) {
			case 'yearly': {
				data = await buildYearlyHistory({ func: client.userManager.fetchUserJoinesBetweenTwoDates });
				return res.json({ data });
			}
			case 'monthly': {
				data = await buildMonthlyHistory({ func: client.userManager.fetchUserJoinesBetweenTwoDates });
				return res.json({ data });
			}
			case 'daily': {
				data = await buildDailyHistory({ func: client.userManager.fetchUserJoinesBetweenTwoDates });
				return res.json({ data });
			}
			case 'hourly': {
				data = await buildHourlyHistory({ func: client.userManager.fetchUserJoinesBetweenTwoDates });
				return res.json({ data });
			}
		}
	};
};

// Endpoint GET /api/admin/users/signUp-source
export const getUserSignupSource = (client: Client) => {
	return async (_req: Request, res: Response) => {
		try {
			const signupSource = await client.userManager.fetchSignUpSource();
			res.json({ signupSource });
		} catch (err) {
			client.logger.error(err);
			Error.GenericError(res, 'Failed to fetch list of sign up sources.');
		}
	};
};

// Endpoint GET /api/admin/users/emails
export const getUserEmails = (client: Client) => {
	return async (_req: Request, res: Response) => {
		try {
			const emails = await client.userManager.fetchCountsByEmailDomain();
			res.json({ emails });
		} catch (err) {
			client.logger.error(err);
			Error.GenericError(res, 'Failed to fetch list of email domains.');
		}
	};
};

// Endpoint GET /api/admin/users/stats
export const getUserStats = (client: Client) => {
	return async (_req: Request, res: Response) => {
		try {
			const [userTotal, avgstorageUsage, banned, admins] = await Promise.all([
				client.userManager.fetchTotal(),
				client.userManager.fetchAverageStorageUsed(),
				client.userManager.fetchBannedTotal(),
				client.userManager.fetchAdminTotal(),
			]);

			res.json({	...userTotal, avgstorageUsage: avgstorageUsage._avg.totalStorageSize, banned, admins	});
		} catch (err) {
			client.logger.error(err);
			Error.GenericError(res, 'Failed to fetch list of email domains.');
		}
	};
};

// Endpoint GET /api/admin/users/sessions
export const getUserSessions = (client: Client) => {
	return async (req: Request, res: Response) => {
		try {
			const result = validateString.safeParse(req.query['userId']);
			if (!result.success) return Error.IncorrectQuery(res, result.error.issues);

			const sessions = await client.sessionManager.fetchAll(result.data);
			return res.json({ sessions });
		} catch (err) {
			client.logger.error(err);
			return Error.GenericError(res, 'Failed to fetch user.');
		}
	};
};

// Endpoint GET /api/admin/users/retention
export const getUserRetention = (client: Client) => {
	return async (_req: Request, res: Response) => {
		try {
			// Loop last 14 days get
			const { total } = await client.userManager.fetchTotal();
			const days: CountMap = {};
			const sessions: CountMap = {};
			const today = new Date();
			today.setHours(0, 0, 0, 0);
			const frameStart = new Date(today);
			frameStart.setDate(today.getDate() - 14);

			for (let i = 14; i >= 0; i--) {
				const end = new Date();
				end.setHours(0, 0, 0, 0);
				end.setDate(end.getDate() - i + 1);

				const start = new Date(end);
				start.setDate(start.getDate() - 1);

				const dateStr = start.toISOString().split('T')[0]!;
				const [users, session] = await Promise.all([
					client.userManager.fetchUsersWhoUploadedBetweenTwoDates(start, end),
					client.userActivityManager.fetchUsersWhoHadActivityBetweenTwoDates(start, end),
				]);

				days[dateStr] = users.length / total;
				sessions[dateStr] = session.length / total;
			}

			res.json({ files: days, sessions });
		} catch (err) {
			client.logger.error(err);
			Error.GenericError(res, 'Failed to fetch user.');
		}
	};
};

// Endpoint GET /api/admin/users/:id
export const getUserById = (client: Client) => {
	return async (req: Request, res: Response) => {
		try {
			const result = validateString.safeParse(req.params['id']);
			if (!result.success) return Error.IncorrectQuery(res, result.error.issues);

			const [user, bannedStatus] = await Promise.all([
				client.userManager.fetchbyParam({ id: result.data, force: true }),
				client.userManager.fetchBanStatus(result.data),
			]);

			return res.json({ user: sanitiseObject(user), bannedStatus });
		} catch (err) {
			client.logger.error(err);
			return Error.GenericError(res, 'Failed to fetch user.');
		}
	};
};

// Endpoint GET /api/admin/users/:id/accounts
export const getUserByIdAccounts = (client: Client) => {
	return async (req: Request, res: Response) => {
		try {
			const result = validateString.safeParse(req.params['id']);
			if (!result.success) return Error.IncorrectQuery(res, result.error.issues);

			const accounts = await client.userManager.fetchAccountsByUserId(result.data);
			return res.json({ accounts });
		} catch (err) {
			client.logger.error(err);
			return Error.GenericError(res, 'Failed to fetch user\'s accounts.');
		}
	};
};

// Endpoint POST /api/admin/users/:id/ban
export const banUserById = (client: Client) => {
	return async (req: Request, res: Response) => {
		try {
			const adminUser = await getSession(client, req.headers) as FullSession;
			const userId = req.params['id'];
			const { expiresAt, reason } = req.body;

			// Validate inputs
			if (typeof userId !== 'string') return Error.IncorrectQuery(res, [{ message: 'User ID is required.' }]);
			if (adminUser.userId === userId) return Error.IncorrectQuery(res, [{ message: 'You cannot ban yourself.' }]);

			const result = validateBan.safeParse({ expiresAt, reason });
			if (!result.success) return Error.IncorrectQuery(res, result.error.issues);

			const ban = await client.userManager.setBanStatus({
				userId,
				issuedByUserId: adminUser.userId,
				...result.data,
			});
			return res.json({ ban });
		} catch (err) {
			client.logger.error(err);
			return Error.GenericError(res, 'Failed to ban user.');
		}
	};
};

// Endpoint GET /api/admin/users/:id/notifications
export const getUsersNotification = (client: Client) => {
	return async (req: Request, res: Response) => {
		const userId = req.params['id'];
		const { page } = req.query;

		// Validate input
		const result = validatePage.safeParse(page);
		if (typeof userId !== 'string') return Error.IncorrectQuery(res, [{ message: 'User ID is required.' }]);
		if (!result.success) return Error.IncorrectQuery(res, result.error?.issues);

		try {
			const [notifications, total] = await Promise.all([
				client.notificationManager.fetchByUserId({ userId, page: result.data ?? 0 }),
				client.notificationManager.fetchCount(userId),
			]);

			return res.json({ notifications, total });
		} catch (err) {
			client.logger.error(err);
			return Error.GenericError(res, 'Failed to fetch user\'s notifications.');
		}
	};
};

// Endpoint GET /api/admin/users/:id/logs
export const getUsersLogs = (client: Client) => {
	return async (req: Request, res: Response) => {
		const userId = req.params['id'];
		const page = req.query['page'];

		// Validate input
		const result = validatePage.safeParse(page);
		if (typeof userId !== 'string') return Error.IncorrectQuery(res, [{ message: 'User ID is required.' }]);
		if (!result.success) return Error.IncorrectQuery(res, result.error.issues);

		try {
			const { logs, total } = await client.AuditLogManager.fetchAll({ userId, page: result.data });
			return res.json({ logs, total });
		} catch (err) {
			client.logger.error(err);
			return Error.GenericError(res, 'Failed to fetch user\'s logs.');
		}
	};
};