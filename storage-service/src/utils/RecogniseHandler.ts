import Landmarks from '../recognise/landmarks';
import NSFW from '../recognise/nsfw';
import Face from '../recognise/face';
import Objects from '../recognise/objects';
import Geo from '../recognise/geo';

export default class RecogniseHandler {
	public Face: null;
	public queue: Array<string>;
	public analyseLandmarks: Landmarks;
	public analyseNSFW: NSFW;
	public analyseFace: Face;
	public analyseObjects: Objects;
	public analyseGeo: Geo;
	constructor() {
		this.Face = null;
		this.analyseLandmarks = new Landmarks();
		this.analyseNSFW = new NSFW();
		this.analyseFace = new Face();
		this.analyseObjects = new Objects();
		this.analyseGeo = new Geo();
		this.queue = [];

		this.init();
	}

	async init() {
		for (const item of this.queue) {
			const res = await Promise.all([this.analyseObjects.run(item)]);
			console.log(res);

			const index = this.queue.indexOf(item);
			if (index > -1) this.queue.splice(index, 1);
		}

		setTimeout(() => this.init(), 1000);
	}

	addToQueue(path: string) {
		this.queue.push(path);
	}
}
