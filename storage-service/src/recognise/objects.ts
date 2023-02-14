import EfficientNet from './EfficientModel';
import rules from '../assets/models/objects.json';
import IMAGENET_CLASSES from '../assets/models/classes';
import { Logger } from '../utils/Logger';
import mimeType from 'mime-types';

interface newResults {
	className: string
	probability: number
	rule?: Ruledata
}
interface Ruledata {
	label: string
	priority: number
	threshold: number
	see?: string
	categories: Array<string>
}

enum classesEnum { Cat = 'cat'}

export default class Objects {
	async run(path: string) {
		Logger.debug(`Checking for objects in in file: ${path}`);

		const fileType = mimeType.lookup(path);
		if (fileType == false || fileType.split('/')[0] !== 'image' || fileType == 'image/webp') return [];

		const imgSize = 512;
		const minInput = -1;
		const model = await EfficientNet.create(`file://${process.cwd()}/src/assets/efficientnetv2/model.json`, imgSize, minInput, IMAGENET_CLASSES);

		const results = await model.inference(path, {
			topK: 7,
			softmax: true,
		});

		const labels = [] as Array<string>;
		const res = results
			.map<newResults>(result => ({
				probability: result.probability,
				className: result.className.split(',')[0].toLowerCase(),
				rule: this.findRule(result.className as classesEnum),
			}));

		res
			.filter(r => {
				if (r.probability < 0.0 || !r.rule) return false;

				const threshold = r.rule.threshold;
				return r.probability >= threshold;
			})
			.forEach((r) => {
				if (r.rule == undefined) return;
				if (r.rule.label) labels.push(r.rule.label);
				if (r.rule.categories) labels.push(...r.rule.categories);
			});

		return res;
	}

	findRule(className: classesEnum): (Ruledata | undefined) {
		const rule = rules[className] as Ruledata;
		if (!rule) return;
		if (rule.see) return this.findRule(rule.see as classesEnum);
		return rule;
	}
}
