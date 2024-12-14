import config from '../config';
import { Jimp } from 'jimp';
import type { JimpClass } from '@jimp/types';
import { intToRGBA } from '@jimp/utils';
import type { GraphModel, Tensor, Rank } from '@tensorflow/tfjs-node';
const NUM_OF_CHANNELS = 3;
const getTF = async () => await import(`@tensorflow/tfjs-node${config.useGPU ? '-gpu' : ''}`);

interface Options {
	topK: number
	softmax: boolean
}

type LabelEnum = { [key: number]: string }

class EfficientModel {
	public modelPath: string;
	public imageSize: number;
	public inputMin: number;
	public labels: LabelEnum;
	public model: GraphModel | null;
	constructor(modelPath: string, imageSize: number, inputMin: number, labels: LabelEnum) {
		this.modelPath = modelPath;
		this.imageSize = imageSize;
		this.inputMin = inputMin;
		this.labels = labels;
		this.model = null;
	}

	static async create(modelURL: string, imgSize: number, inputMin: number, labels: LabelEnum) {
		const model = new EfficientModel(modelURL, imgSize, inputMin, labels);
		await model.load();
		return model;
	}

	async load() {
		const tf = await getTF();
		this.model = await tf.loadGraphModel(this.modelPath);
	}

	predict(tensor: Tensor<Rank>) {
		return this.model?.predict(tensor);
	}

	async inference(imgPath: string, options: Options) {
		const tf = await getTF();
		const { topK = 3 } = options;
		const inputMax = 1;
		const inputMin = this.inputMin;
		const normalizationConstant = (inputMax - inputMin) / 255.0;
		const jimage = await Jimp.read(imgPath);
		const image = await this.createTensor(jimage);


		const logits = tf.tidy(() => {
			// Normalize the image from [0, 255] to [inputMin, inputMax].
			const normalized = tf.add(
				tf.mul(tf.cast(image, 'float32'), normalizationConstant),
				inputMin) as any;

			// Resize the image to
			let resized = normalized;
			if (image.shape[0] !== this.imageSize || image.shape[1] !== this.imageSize) {
				const alignCorners = true;
				resized = tf.image.resizeBilinear(
					normalized, [this.imageSize, this.imageSize], alignCorners);
			}

			// Reshape so we can pass it to predict.
			const reshaped = tf.reshape(resized, [-1, this.imageSize, this.imageSize, 3]);

			return this.predict(reshaped);
		});

		if (logits == undefined) return [];
		let values;
		if (options.softmax) {
			values = tf.softmax(await logits.data());
		} else {
			values = tf.tensor(await logits.data());
		}
		const prediction = getTopKClasses(await values.data(), topK, this.labels);
		values.dispose();
		image.dispose();
		return prediction;
	}

	async createTensor(image: JimpClass) {
		const tf = await getTF();
		const values = new Float32Array(image.bitmap.width * image.bitmap.height * NUM_OF_CHANNELS);
		let i = 0;
		image.scan(0, 0, image.bitmap.width, image.bitmap.height, (x, y) => {
			const pixel = intToRGBA(image.getPixelColor(x, y));
			values[i * NUM_OF_CHANNELS + 0] = pixel.r;
			values[i * NUM_OF_CHANNELS + 1] = pixel.g;
			values[i * NUM_OF_CHANNELS + 2] = pixel.b;
			i++;
		});
		const outShape = [
			image.bitmap.height,
			image.bitmap.width,
			NUM_OF_CHANNELS,
		] as [number, number, number];
		const imageTensor = tf.tensor3d(values, outShape, 'float32');
		return imageTensor;
	}

}

/**
 * @param values
 * @param topK
 * @param labels
 */
function getTopKClasses(values: (Uint8Array | Float32Array | Int32Array), topK: number, labels: LabelEnum) {
	const valuesAndIndices = [];
	for (let i = 0; i < values.length; i++) {
		valuesAndIndices.push({ value: values[i], index: i });
	}
	valuesAndIndices.sort((a, b) => {
		return b.value - a.value;
	});
	const topkValues = new Float32Array(topK);
	const topkIndices = new Int32Array(topK);
	for (let i = 0; i < topK; i++) {
		topkValues[i] = valuesAndIndices[i].value;
		topkIndices[i] = valuesAndIndices[i].index;
	}
	const topClassesAndProbs = [];
	for (let i = 0; i < topkIndices.length; i++) {
		topClassesAndProbs.push({
			className: labels[topkIndices[i]],
			probability: topkValues[i],
		});
	}
	return topClassesAndProbs;
}

export default EfficientModel;
