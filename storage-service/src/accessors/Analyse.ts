import client from './prisma';
import { Logger } from '../utils';

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
	Logger.debug(`[DATABASE] Created analyse for ${data.location}.`);
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
	Logger.debug(`[DATABASE] Fetched analyse for ${data.location}.`);
	return client.analysed.findUnique({
		where: {
			userId_location: {
				userId: data.userId,
				location: data.location,
			},
		},
	});
}
