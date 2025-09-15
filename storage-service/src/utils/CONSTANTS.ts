export const PATHS = {
	AVATAR: `${process.cwd()}/src/uploads/avatars`,
	DATABASE_BACKUPS: `${process.cwd()}/prisma/backups`,
};

export const ipRegex = /^((\d|[1-9]\d|1\d{2}|2[0-4]\d|25[0-5])(\.(?!$)|$)){4}$|^(([\da-fA-F]{1,4}:){7}[\da-fA-F]{1,4}|::(?:ffff:(\d|[1-9]\d|1\d{2}|2[0-4]\d|25[0-5])(\.\d{1,3}){3})?)$/;