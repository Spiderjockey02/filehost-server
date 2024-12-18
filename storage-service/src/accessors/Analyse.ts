import client from './prisma';

interface CreateAnalyse {
  location: string
  userId: string
  landmark?: string
  nsfw?: string
  face?: string
  objects?: string
  geo?: string
}

export async function createAnalyse(data: CreateAnalyse) {
	return client.analysed.create({
		data: {
			location: data.location,
			userId: data.userId,
			landmark: data.landmark,
			nsfw: data.nsfw,
			face: data.face,
			objects: data.objects,
			geo: data.geo,
		},
	});
}

interface FetchAnalysed {
  location: string
  userId: string
}

export async function fetchAnalysed(data: FetchAnalysed) {
	return client.analysed.findUnique({
		where: {
			userId_location: {
				userId: data.userId,
				location: data.location,
			},
		},
	});
}
