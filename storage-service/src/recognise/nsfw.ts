import * as nsfwjs from 'nsfwjs';
import fs from 'fs/promises';
import mimeType from 'mime-types';
import type { Tensor3D } from '@tensorflow/tfjs-node';
import { Logger } from '../utils';
import config from '../config';
const getTF = async () => await import(`@tensorflow/tfjs-node${config.useGPU ? '-gpu' : ''}`);

export default class NSFW {
	/**
	 * Function for checking if file is NSFW or not
	 * @param {string} path The path to file for analyse
	*/
	async run(path: string) {
		Logger.debug(`Checking NSFW content in file: ${path}`);
		// Can only detect NSFW content from images
		const fileType = mimeType.lookup(path);
		if (fileType == false || fileType.split('/')[0] !== 'image') return [];

		try {
			const model = await nsfwjs.load();
			const imageBuffer = await fs.readFile(path);
			let data, decodedImage;

			// Handle images and GIF differently
			if (['image/gif', 'image/apng'].includes(fileType)) {
				/*
				data = await model.classifyGif(imageBuffer, {
					topk: 1,
					fps: 1,
				});
				*/
				return [];
			} else {
				const tf = await getTF();
				decodedImage = tf.node.decodeImage(imageBuffer);
				data = await model.classify(decodedImage as Tensor3D);
				decodedImage.dispose();
			}
			Logger.debug(`Response from checking NSFW content: ${JSON.stringify(data)}`);
			return data.flat();
		} catch (err) {
			Logger.error(JSON.stringify(err));
			return [];
		}
	}
}
