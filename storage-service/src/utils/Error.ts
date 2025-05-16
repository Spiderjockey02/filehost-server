import type { Response } from 'express';

export default class Error {
	/**
		* Tell the requestee an error occured.
		* @param {Response} res The response to the requestee
		* @param {string} errMsg The error message
	*/
	public static GenericError(res: Response, errMsg: string) {
		return res
			.status(500)
			.json({ error: `${errMsg} If this error keeps occurring, please contact support.` });
	}

	/**
		* Tell the requestee they do not have permission to access the endpoint.
		* @param {Response} res The response to the requestee
	*/
	public static InvalidSession(res: Response) {
		return res
			.status(403)
			.json({ error: 'Session is invalid, please try logout and sign in again.' });
	}

	/**
		* Tell the requestee they do not have permission to access the endpoint.
		* @param {Response} res The response to the requestee
	*/
	public static InvalidAccess(res: Response) {
		return res
			.status(401)
			.json({ error: 'You do not have permission to access this resource.' });
	}

	/**
		* Tell the requestee the login was invalid (password wrong etc)
		* @param {Response} res The response to the requestee
	*/
	public static InvalidLogin(res: Response) {
		return res
			.status(401)
			.json({ error: 'Invalid username or password.' });
	}

	/**
		* Tell the requestee the requested data doesn't exists
		* @param {Response} res The response to the requestee
		* @param {string} errMsg The error message to send
	*/
	public static MissingResource(res: Response, errMsg: string) {
		return res
			.status(404)
			.json({ error: errMsg });
	}

	/**
		* Tell the requestee their query is invalid
		* @param {Response} res The response to the requestee
		* @param {string} errMsg The error message
	*/
	public static IncorrectQuery(res: Response, errMsg: any) {
		return res
			.status(412)
			.json({ error: errMsg });
	}

}