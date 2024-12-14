import EfficientNet from './EfficientModel';
import rules from '../assets/models/objects.json';
import IMAGENET_CLASSES from '../assets/models/classes';
import { Logger } from '../utils';
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
type data = { [key: string]: number}
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

		const labels = new Array<string>();
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

		const catProbabilities = {} as data;
		const catThresholds = {} as data;
		const catCount = {} as data;

		res.forEach(r => {
			if (r.rule) {
				let categories = [];
				if (r.rule.label) {
					categories.push(r.rule.label);
				}
				if (r.rule.categories) {
					categories = categories.concat(r.rule.categories);
				}
				categories.forEach((category: string) => {
					if (!(category in catProbabilities)) catProbabilities[category] = 0;
					if (!(category in catThresholds)) catThresholds[category] = 0;
					if (!(category in catCount)) catCount[category] = 0;

					catProbabilities[category] += r.probability ** 2;
					catThresholds[category] = Math.max(catThresholds[category], (r.rule?.threshold ?? 0));
					catCount[category]++;
				});
			}
		});

		Object.entries(catProbabilities)
			.filter(([category, probability]) => {
				if (catCount[category] <= 1) return false;

				return probability ** (1 / 2) >= catThresholds[category];
			})
			.forEach(([category]) => {
				labels.push(category);
			});

		return labels;
	}

	findRule(className: classesEnum): (Ruledata | undefined) {
		const rule = rules[className] as Ruledata;
		if (!rule) return;
		if (rule.see) return this.findRule(rule.see as classesEnum);
		return rule;
	}
}
