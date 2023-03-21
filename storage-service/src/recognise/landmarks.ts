import EfficientNet from './EfficientModel';
import { Logger } from '../utils/Logger';
import mimeType from 'mime-types';

// Types
type landmarkNames = 'landmarks_africa' | 'landmarks_asia' | 'landmarks_europe'| 'landmarks_north_america' | 'landmarks_south_america'| 'landmarks_oceania';
interface LandmarkData {
	className: string
	probability: number
}

export default class Landmarks {
	/**
	 * Function for getting landmarks from file
	 * @param {string} path The path to file for analyse
	*/
	async run(path: string) {
		Logger.debug(`Checking for landmarks in file: ${path}.`);

		const fileType = mimeType.lookup(path);
		if (fileType == false || fileType.split('/')[0] !== 'image' || fileType == 'image/webp') return [];

		const imgSize = 321;
		const minInput = 0;
		const models = ['landmarks_africa', 'landmarks_asia', 'landmarks_europe', 'landmarks_north_america', 'landmarks_south_america', 'landmarks_oceania'];

		const labels = [] as Array<LandmarkData>;
		for (const modelName of models) {
			try {
				const results = await this.analyse(modelName as landmarkNames, imgSize, minInput, path);
				labels.push(...results);
			} catch (e) {
				console.error(e);
			}
		}
		Logger.debug(`Found: ${labels.flat().map(i => `${i.className} (${i.probability.toFixed(3)})`)}.`);
		return labels;
	}

	async analyse(modelName: landmarkNames, imgSize: number, minInput: number, path: string) {
		const landmarks = {
			landmarks_africa: (await import('../assets/landmarks/africa.json')).name,
			landmarks_asia: (await import('../assets/landmarks/asia.json')).name,
			landmarks_europe: (await import('../assets/landmarks/europe.json')).name,
			landmarks_north_america: (await import('../assets/landmarks/north_america.json')).name,
			landmarks_south_america: (await import('../assets/landmarks/south_america.json')).name,
			landmarks_oceania: (await import('../assets/landmarks/oceania.json')).name,
		};

		const model = await EfficientNet.create(`file://${process.cwd()}/src/assets/models/${modelName}/model.json`, imgSize, minInput, landmarks[modelName]);

		try {
			let results = await model.inference(path, {
				topK: 7,
				softmax: false,
			});

			results = results
				.filter((r, i) => results.findIndex((item) => item.className == r.className) == i)
				.filter((r) => {
					if (r.probability < 0.0) {
						return false;
					}
					return r.probability >= 0.9;
				});
			return results;
		} catch (e) {
			console.error(e);
			return [];
		}
	}
}
