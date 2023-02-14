import EfficientNet from './EfficientModel';
import rules from '../assets/models/objects.json';
import IMAGENET_CLASSES from '../assets/models/classes';
import { Logger } from '../utils/Logger';

interface newResults {
	className: string
	probability: number
	rule?: any
}

export default class Objects {
	async run(path: string) {
		Logger.debug(`Checking for objects in in file: ${path}`);
		const imgSize = 512;
		const minInput = -1;

		const model = await EfficientNet.create(`file://${process.cwd()}/src/assets/efficientnetv2/model.json`, imgSize, minInput, IMAGENET_CLASSES);

		const results = await model.inference(path, {
			topK: 7,
			softmax: true,
		});

		const labels = [] as Array<any>;
		const res = results
			.map<newResults>(result => ({
				probability: result.probability,
				className: result.className.split(',')[0].toLowerCase(),
				rule: this.findRule(result.className),
			}));

		res
			.filter(r => {
				if (r.probability < 0.0 || !r.rule) return false;

				const threshold = r.rule.threshold;
				return r.probability >= threshold;
			})
			.forEach((r) => {
				console.log('r', r);
				if (r.rule.label) labels.push(r.rule.label);
				if (r.rule.categories) labels.push(...r.rule.categories);
			});


		return res;
	}

	findRule(className: string): (string | undefined) {
		// @ts-ignore
		const rule = rules[className];
		if (!rule) return;
		if (rule.see) return this.findRule(rule.see);
		return rule;
	}
}
