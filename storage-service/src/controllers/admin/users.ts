import { Error, sanitiseObject } from '../../utils';
import type { Request, Response } from 'express';
import type Client from '../../helpers/Client';

type data = { [key: string]: boolean}
type countEnum = { [key: string | number]: number }

// Endpoint: GET /api/admin/users
export const getUsers = (client: Client) => {
	return async (req: Request, res: Response) => {
		try {
			const rawFilters = req.query.filters;
			const filters = (rawFilters !== undefined && Array.isArray(rawFilters)) ? rawFilters.map((filter) => filter.toString()) : [];

			// Parse the filters and validate them
			const parsedFilters: data = {};
			for (const filter of filters) {
				if (['group', 'recent', 'delete', 'analyse'].includes(filter)) parsedFilters[filter] = true;
			}

			// Fetch the database
			const users = await client.userManager.fetchAll(parsedFilters);
			res.json({ users: sanitiseObject(users) });
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

		switch(frame) {
			case 'yearly': {
				// Get last 10 year
				const years: countEnum = {};
				const currentYear = new Date().getFullYear();

				for (let i = 0; i <= 9; i++) {
					const start = new Date(currentYear - i, 0, 1);
					const end = new Date(currentYear - i + 1, 0, 1);
					const users = await client.userManager.fetchUserJoinesBetweenTwoDates(start, end);
					years[new Date().getFullYear() - i] = users;
				}
				return res.json({ years });
			}
			case 'monthly': {
				// Get last 12 months
				const months: countEnum = { 'January': 0, 'February': 0, 'March': 0, 'April': 0, 'May': 0, 'June': 0, 'July': 0, 'August': 0, 'September': 0, 'October': 0, 'November': 0, 'December': 0 };
				const current = new Date();
				current.setDate(1);

				for (let i = 0; i <= 11; i++) {
					const start = new Date(current);
					const end = new Date(current);
					end.setMonth(end.getMonth() + 1);

					const monthName = Object.keys(months).at(current.getMonth()) as string;
					const users = await client.userManager.fetchUserJoinesBetweenTwoDates(start, end);
					months[monthName] = users;

					current.setMonth(current.getMonth() - 1);
				}
				return res.json({ months });
			}
			case 'daily': {
				// Get last 14 days
				const days: countEnum = {};
				for (let i = 0; i <= 14; i++) {
					const end = new Date();
					end.setHours(0, 0, 0, 0);
					end.setDate(end.getDate() - i + 1);

					const start = new Date(end);
					start.setDate(start.getDate() - 1);

					const dateStr = start.toISOString().split('T')[0];
					const users = await client.userManager.fetchUserJoinesBetweenTwoDates(start, end);
					days[dateStr] = users;
				}

				return res.json({ days });
			}
		}
	};
};

