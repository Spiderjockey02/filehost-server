import client from './prisma';


/**
  * Fetches or creates a file media type in the database.
  * @param mimeType The mime type to fetch or create.
  * @returns The media type object.
*/
export async function fetchOrCreateFileMediaType(mimeType: string) {
	return client.mediaType.upsert({
		where: {
			name: mimeType,
		},
		create: {
			name: mimeType,
		},
		update: {},
	});
}

/**
  * Fetches all media types from the database and the number of files associated with each type.
*/
export async function fetchFileMediaTypes() {
	return client.mediaType.findMany({
		include: {
			_count: {
				select: {
					files: true,
				},
			},
		},
	});
}