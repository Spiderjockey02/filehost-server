import { Error, sanitiseObject } from '../../utils';
import type { Request, Response } from 'express';
import type Client from '../../helpers/Client';
import { fetchUsersWhoHadActivityBetweenTwoDates } from '../../accessors/UserActivity';

type data = { [key: string]: boolean}
type countEnum = { [key: string | number]: number }

// Endpoint: GET /api/admin/users
export const getUsers = (client: Client) => {
	return async (req: Request, res: Response) => {
		try {
			const { page, include: rawFilters } = req.query;
			const filters = (rawFilters !== undefined && Array.isArray(rawFilters)) ? rawFilters.map((filter) => filter.toString()) : [`${rawFilters}`];

			// Parse the filters and validate them
			const parsedFilters: data = {};
			for (const filter of filters) {
				if (['group', 'recent', 'delete', 'analyse', 'user'].includes(filter)) parsedFilters[filter] = true;
			}

			// Valid page index (if present)
			if (page !== undefined && (typeof page !== 'string' || !/^\d+$/.test(page) || Number(page) < 0)) return Error.IncorrectQuery(res, 'page must be a positive number.');

			// Fetch the database
			const users = await client.userManager.fetchAll({ ...parsedFilters, page: isNaN(Number(page)) ? undefined : Number(page) });
			const { total } = await client.userManager.fetchTotal();
			res.json({ users: sanitiseObject(users), total });
		} catch (err) {
			client.logger.error(err);
			Error.GenericError(res, 'Failed to fetch list of users.');
		}
	};
};

// Endpoint: GET /api/admin/users/language-codes
export const getUsersByLanguageCode = (client: Client) => {
	return async (_req: Request, res: Response) => {
		try {
			// Fetch the database
			const langaugeCodes = await client.userManager.fetchGroupCountsByLanguageCodes();
			res.json({ langaugeCodes });
		} catch (err) {
			client.logger.error(err);
			Error.GenericError(res, 'Failed to fetch list of users.');
		}
	};
};


// Endpoint: GET /api/admin/users/growth
export const getUserGrowth = (client: Client) => {
	return async (req: Request, res: Response) => {
		// Get time frame and validate it
		const frame = req.query.frame;
		if (!frame || typeof frame !== 'string' || !['yearly', 'monthly', 'daily'].includes(frame)) return Error.IncorrectQuery(res, `frame must be on one of the following: ${['yearly', 'monthly', 'daily'].join(', ')}`);

		switch (frame) {
			case 'yearly': {
				const years: countEnum = {};
				const currentYear = new Date().getFullYear();
				let cumulativeTotal = await client.userManager.fetchUserJoinesBetweenTwoDates(new Date(2023, 0, 1), new Date(currentYear - 9, 0, 1));

				for (let i = 9; i >= 0; i--) {
					const start = new Date(currentYear - i, 0, 1);
					const end = new Date(currentYear - i + 1, 0, 1);
					const users = await client.userManager.fetchUserJoinesBetweenTwoDates(start, end);
					cumulativeTotal += users;
					years[currentYear - i] = cumulativeTotal;
				}
				return res.json({ years });
			}
			case 'monthly': {
				const months: countEnum = {};
				const current = new Date();
				current.setDate(1);

				const firstMonthDate = new Date();
				firstMonthDate.setMonth(current.getMonth() - 11);

				let cumulativeTotal = await client.userManager.fetchUserJoinesBetweenTwoDates(new Date(2023, 0, 1), new Date(firstMonthDate));
				for (let i = 11; i >= 0; i--) {
					const start = new Date(current);
					start.setMonth(current.getMonth() - i);
					const end = new Date(start);
					end.setMonth(start.getMonth() + 1);

					const monthName = start.toLocaleString('default', { month: 'long' });
					const users = await client.userManager.fetchUserJoinesBetweenTwoDates(start, end);
					cumulativeTotal += users;
					months[monthName] = cumulativeTotal;
				}
				return res.json({ months });
			}
			case 'daily': {
				const days: countEnum = {};
				const today = new Date();
				today.setHours(0, 0, 0, 0);
				const frameStart = new Date(today);
				frameStart.setDate(today.getDate() - 14);
				let cumulativeTotal = await client.userManager.fetchUserJoinesBetweenTwoDates(new Date(2023, 0, 1), frameStart);

				for (let i = 14; i >= 0; i--) {
					const end = new Date();
					end.setHours(0, 0, 0, 0);
					end.setDate(end.getDate() - i + 1);

					const start = new Date(end);
					start.setDate(start.getDate() - 1);

					const dateStr = start.toISOString().split('T')[0];
					const users = await client.userManager.fetchUserJoinesBetweenTwoDates(start, end);
					cumulativeTotal += users;
					days[dateStr] = cumulativeTotal;
				}
				return res.json({ days });
			}
		}
	};
};

// Endpoint GET /api/admin/users/signUp-source
export const getUserSignupSource = (client: Client) => {
	return async (_req: Request, res: Response) => {
		try {
			// Fetch the database
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
			// Fetch the database
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


			res.json({
				total: userTotal.total, new: userTotal.new, active: userTotal.active, avgstorageUsage: avgstorageUsage._avg.totalStorageSize, banned, admins,
			});
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
			const userId = req.query.userId;
			if (userId !== undefined && typeof userId !== 'string') return Error.IncorrectQuery(res, 'userID must be a string or undefined.');

			const sessions = await client.sessionManager.fetchAll(userId);
			res.json({ sessions });
		} catch (err) {
			client.logger.error(err);
			Error.GenericError(res, 'Failed to fetch user.');
		}
	};
};

// Endpoint GET /api/admin/users/retention
export const getUserRetention = (client: Client) => {
	return async (_req: Request, res: Response) => {
		try {
			// Loop last 14 days get
			const { total } = await client.userManager.fetchTotal();
			const days: countEnum = {};
			const sessions: countEnum = {};
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

				const dateStr = start.toISOString().split('T')[0];
				const [users, session] = await Promise.all([
					client.userManager.fetchUsersWhoUploadedBetweenTwoDates(start, end),
					fetchUsersWhoHadActivityBetweenTwoDates(start, end),
				]);

				days[dateStr] = users.length / total;
				sessions[dateStr] = session.length / total;
			}
			return res.json({ retention: { files: days, sessions } });

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
			const userId = req.params.id;
			const user = await client.userManager.fetchbyParam({ id: userId, force: true });
			res.json({ user: sanitiseObject(user) });
		} catch (err) {
			client.logger.error(err);
			Error.GenericError(res, 'Failed to fetch user.');
		}
	};
};