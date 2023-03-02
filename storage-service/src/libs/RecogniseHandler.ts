import { Landmarks, NSFW, Face, Objects, Geo } from '../recognise';
import { createAnalyse } from '../db/Analyse';
import { PATHS } from '../utils/CONSTANTS';

export default class RecogniseHandler {
	private queue: Array<string>;
	private analyseLandmarks: Landmarks;
	private analyseNSFW: NSFW;
	private analyseFace: Face;
	private analyseObjects: Objects;
	private analyseGeo: Geo;
	constructor() {
		this.analyseLandmarks = new Landmarks();
		this.analyseNSFW = new NSFW();
		this.analyseFace = new Face();
		this.analyseObjects = new Objects();
		this.analyseGeo = new Geo();
		this.queue = [];

		this.init();
	}

	private async init() {
		for (const path of this.queue) {
			// Analyse image through all systems
			const [landmark, nsfw, face, objects, geo] = await Promise.all([this.analyseLandmarks.run(path), this.analyseNSFW.run(path),
				this.analyseFace.run(path), this.analyseObjects.run(path), this.analyseGeo.run(path)]);

			console.log({ landmark, nsfw, face, objects, geo });
			// Save to database
			const userId = path.replace(PATHS.CONTENT, '').split('/')[1];
			const location = path.replace(PATHS.CONTENT, '').split('/').slice(2).join('/');

			await createAnalyse({ location, userId, landmark: JSON.stringify(landmark),
				nsfw: JSON.stringify(nsfw), face: JSON.stringify(face), objects: JSON.stringify(objects), geo: JSON.stringify(geo),
			});

			// Remove from queue
			const index = this.queue.indexOf(path);
			if (index > -1) this.queue.splice(index, 1);
		}

		setTimeout(() => this.init(), 1000);
	}

	public addToQueue(path: string | Array<string>) {
		if (Array.isArray(path)) {
			this.queue.push(...path);
		} else {
			this.queue.push(path);
		}
	}
}
