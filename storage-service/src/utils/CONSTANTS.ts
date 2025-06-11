export const PATHS = {
	AVATAR: `${process.cwd()}/src/uploads/avatars`,
	THUMBNAIL: `${process.cwd()}/src/uploads/thumbnails`,
	CONTENT: `${process.cwd()}/src/uploads/content`,
	TRASH: `${process.cwd()}/src/uploads/trash`,
	DATABASE_BACKUPS: `${process.cwd()}/prisma/backups`,
};

export const ipRegex = /^((\d|[1-9]\d|1\d{2}|2[0-4]\d|25[0-5])(\.(?!$)|$)){4}$|^(([\da-fA-F]{1,4}:){7}[\da-fA-F]{1,4}|::(?:ffff:(\d|[1-9]\d|1\d{2}|2[0-4]\d|25[0-5])(\.\d{1,3}){3})?)$/;

export const CONSTANTS = {
	// Max uploaded file size in bytes
	MAX_FILE_SIZE: 10 * 1024 ** 3,

	// Max avatar file size in bytes
	MAX_AVATAR_SIZE: 5 * 1024 ** 2,

	// How long files should stay in the trash before actually deleting in days
	RETENTION_POLICY_IN_DAYS: 7,

	// Maximum characters for file name
	MAX_CHARS_FILE_NAME: 32,

	// What mime types are not allowed to be uploaded
	DISALLOWED_MIME_TYPES: ['image/bmp'],

	// What characters or words that are not allowed in a file name
	INVALID_CHARS_IN_FILE_NAME: ['/', '\\', '?', '%', '*', ':', '|', '"', '<', '>'],

	// Whether or not to keep original metadata on videos and images
	KEEP_ORIGINAL_METADATA: false,

	// Width & Height of the thumbnail including the file extension
	THUMBNAIL: {
		WIDTH: 400,
		HEIGHT: 520,
		// End of the file (etc jpg, png, etc)
		EXTENSION: 'jpg',
	},

	// How many days should log files stay on system before being deleted
	RETENTION_POLICY_FOR_LOG_FILES_IN_DAYS: 90,

	// Starting folder size (typically it's the size of a 'sector' on your hDD)
	FOLDER_SIZE: 4096n,
};