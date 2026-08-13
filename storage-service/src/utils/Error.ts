import type { Response } from 'express';

export default class Error {
	/**
		* Tell the requestee an error occured.
		* @param {Response} res The response to the requestee
		* @param {string} errMsg The error message
	*/
	public static GenericError(res: Response, errMsg: string) {
		res
			.status(500)
			.json({ error: `${errMsg} If this error keeps occurring, please contact support.` });
	}

	/**
		* Tell the requestee they do not have permission to access the endpoint.
		* @param {Response} res The response to the requestee
	*/
	public static InvalidSession(res: Response) {
		res
			.status(403)
			.json({ error: 'Session is invalid, please try logout and sign in again.' });
	}

	/**
		* Tell the requestee they do not have permission to access the endpoint.
		* @param {Response} res The response to the requestee
	*/
	public static InvalidAccess(res: Response) {
		res
			.status(401)
			.json({ error: 'You do not have permission to access this resource.' });
	}

	/**
		* Tell the requestee the login was invalid (password wrong etc)
		* @param {Response} res The response to the requestee
	*/
	public static InvalidLogin(res: Response) {
		res
			.status(401)
			.json({ error: 'Invalid username or password.' });
	}

	/**
		* Tell the requestee the requested data doesn't exists
		* @param {Response} res The response to the requestee
	*/
	public static MissingResource(res: Response) {
		res
			.status(404)
			.json({ error: 'The resource you have requested has not been found.' });
	}

	/**
		* Tell the requestee their query is invalid
		* @param {Response} res The response to the requestee
		* @param {$ZodIssue[]} errors The error message
	*/
	public static IncorrectQuery(res: Response, errors: {message: string}[]) {
		const issue = errors.at(0);
		if (!issue) return res.status(412).json({ error: 'Unknown validation error.' });

		return res.status(412).json({ error: issue.message });
	}

	/**
	  * Tell the requestee they are being rate limited
	  * @param {Response} res The response to the requestee
	*/
	public static RateLimited(res: Response) {
		res
			.status(429)
			.json({
				error: 'Too many requests. Please wait a second and try again.',
			});
	}
}