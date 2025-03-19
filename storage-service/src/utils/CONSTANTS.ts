export const PATHS = {
	AVATAR: `${process.cwd()}/src/uploads/avatars`,
	THUMBNAIL: `${process.cwd()}/src/uploads/thumbnails`,
	CONTENT: `${process.cwd()}/src/uploads/content`,
	TRASH: `${process.cwd()}/src/uploads/trash`,
};

export const ipRegex = /^((\d|[1-9]\d|1\d{2}|2[0-4]\d|25[0-5])(\.(?!$)|$)){4}$|^(([\da-fA-F]{1,4}:){7}[\da-fA-F]{1,4}|::(?:ffff:(\d|[1-9]\d|1\d{2}|2[0-4]\d|25[0-5])(\.\d{1,3}){3})?)$/;

export const CONSTANTS = {
	// 10 GB
	MAX_FILE_SIZE: 10737418240,

	// How long files should stay in the trash before actually deleting in days
	RETENTION_POLICY_IN_DAYS: 7,

	// Maximum characters for file name
	MAX_CHARS_FILE_NAME: 32,

	// What mime types are not allowed to be uploaded
	DISALLOWED_MIME_TYPES: ['application/*', 'image/bmp'],

	// What characters or words that not allowed in a file name
	INVALID_CHARS_IN_FILE_NAME: ['/', '\\', '?', '%', '*', ':', '|', '"', '<', '>'],
};