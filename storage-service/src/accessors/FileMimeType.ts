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
export async function fetchFileMediaTypes(grouped: boolean = false) {
	const res = await client.mediaType.findMany({
		include: {
			_count: {
				select: {
					files: true,
				},
			},
		},
	});

	const group: { [ key: string ]: number } = {};
	if (grouped) {
		for (const type of res) {
			const mimeName = `${type.name.split('/')[0]}/*`;

			if (group[mimeName] === undefined) group[mimeName] = 0;
			group[mimeName] += type._count.files;
		}
		return group;
	} else {
		for (const type of res) {
			if (group[type.name] === undefined) group[type.name] = 0;
			group[type.name] += type._count.files;
		}
		return group;
	}
}

export async function fetchMostCommonFileTypes() {
	return client.mediaType.findMany({
		include: {
			_count: {
				select: {
					files: true,
				},
			},
		},
		orderBy: {
			files: {
				_count: 'desc',
			},
		},
		take: 10,
	});
}