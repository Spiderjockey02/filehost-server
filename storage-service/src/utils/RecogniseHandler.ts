import Landmarks from '../recognise/landmarks';
import NSFW from '../recognise/nsfw';
import Face from '../recognise/face';
import Objects from '../recognise/objects';
import Geo from '../recognise/geo';

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
