import type { Response } from 'express';

export default class Error {
	/**
		* Tell the requestee their query is invalid
		* @param {Response} res The response to the requestee
		* @param {string} errMsg The error message
	*/
	public static IncorrectQuery(res: Response, errMsg: string) {
		return res
			.status(412)
			.json({ error: errMsg });
	}

	/**
		* Tell the requestee their query is invalid
		* @param {Response} res The response to the requestee
		* @param {string} errMsg The error message
	*/
	public static IncorrectBodyValue(res: Response, errMsg: string) {
		return res
			.status(412)
			.json({ error: `${errMsg} inside the request body.` });
	}

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
		* Tell the requestee the path is invalid.
		* @param {Response} res The response to the requestee
		* @param {string} endpoint The endpoint that doesn't exist
	*/
	public static MissingEndpoint(res: Response, endpoint: string) {
		return res
			.status(404)
			.json({ error: `${endpoint} is not a valid endpoint.` });
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
		* Tell the requestee the file type is unsupported
		* @param {Response} res The response to the requestee
		* @param {Array<string>} fileTypes The array of filetypes that are supported
	*/
	public static UnsupportedFileType(res: Response, fileTypes: Array<string>) {
		return res
			.status(415)
			.json({ error: `File must be MIME type(s): ${fileTypes.join(', ')}. ` });
	}

	/**
		* Tell the requestee the video's dimensions are too large (3840x2160)
		* @param {Response} res The response to the requestee
	*/
	public static FileTooLarge(res: Response) {
		return res
			.status(413)
			.json({ error: 'File is too large.' });
	}

	/**
		* Tell the requestee they do not have permission to access the endpoint.
		* @param {Response} res The response to the requestee
	*/
	public static MissingAccess(res: Response, error?: string) {
		return res
			.status(403)
			.json({ error: error ?? 'You are not authorised to use this endpoint' });
	}

}