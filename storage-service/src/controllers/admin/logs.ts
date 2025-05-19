import type { Request, Response } from 'express';
import { Error } from '../../utils';
import fs from 'fs/promises';
import Client from 'src/helpers/Client';
import { existsSync } from 'fs';

// Endpoint: GET /api/admin/logs
export const getLogs = (client: Client) => {
	return async (_req: Request, res: Response) => {
		try {
			// Fetch all logs and total byte size
			const logs = await fs.readdir(`${process.cwd()}/src/utils/logs`);
			const stats = await Promise.all(logs.map(path => fs.stat(`${process.cwd()}/src/utils/logs/${path}`)));
			const totalLogSize = stats.reduce((acc, stat) => acc + stat.size, 0);

			res.json({ logs: logs.reverse(), totalLogSize });
		} catch (error) {
			client.logger.error(error);
			return Error.GenericError(res, 'Failed to fetch logs.');
		}
	};
};

// Endpoint: GET /api/admin/logs/:date
export const getSpecificLog = (client: Client) => {
	return async (req: Request, res: Response) => {
		const date = req.params.date;

		try {
			// Check if the file exists
			if (!existsSync(`${process.cwd()}/src/utils/logs/${date}`)) return Error.IncorrectQuery(res, 'Log file does not exist.');

			const log = await fs.readFile(`${process.cwd()}/src/utils/logs/${date}`, 'utf-8');
			res.json({ file: log.toString().split(/\r?\n/) });
		} catch (err) {
			client.logger.error(err);
			Error.GenericError(res, 'Failed to fetch log file.');
		}
	};
};