import * as tf from '@tensorflow/tfjs-node-gpu';
import * as faceapi from '@vladmandic/face-api/dist/face-api.node-gpu.js';
import fs from 'fs/promises';
import { Logger } from '../utils/Logger';
import mimeType from 'mime-types';

export default class Face {
	/**
	 * Function for getting faces from file
	 * @param {string} path The path to file for analyse
	*/
	async run(path: string) {
		Logger.debug(`Checking for faces in file: ${path}`);

		const fileType = mimeType.lookup(path);
		if (fileType == false || fileType.split('/')[0] !== 'image' || ['image/gif', 'image/apng'].includes(fileType)) return [];

		try {
			await faceapi.nets.ssdMobilenetv1.loadFromDisk(`${process.cwd()}/node_modules/@vladmandic/face-api/model`);
			await faceapi.nets.faceLandmark68Net.loadFromDisk(`${process.cwd()}/node_modules/@vladmandic/face-api/model`);
			await faceapi.nets.faceRecognitionNet.loadFromDisk(`${process.cwd()}/node_modules/@vladmandic/face-api/model`);
			await faceapi.nets.ageGenderNet.loadFromDisk(`${process.cwd()}/node_modules/@vladmandic/face-api/model`);
			const tensor = tf.node.decodeImage(await fs.readFile(path), 3);

			const results = await faceapi.detectAllFaces(tensor).withFaceLandmarks().withFaceDescriptors().withAgeAndGender();

			// Return results
			tensor.dispose();
			const vectors = results
				.map(result => ({
					angle: result.angle,
					vector: result.descriptor,
					x: result.detection.relativeBox.x,
					y: result.detection.relativeBox.y,
					height: result.detection.relativeBox.height,
					width: result.detection.relativeBox.width,
					score: result.detection.score,
					age: Math.round(result.age),
					gender: {
						type: result.gender,
						score: result.genderProbability,
					},
				}));

			return vectors;
		} catch (e) {
			return [];
		}
	}
}
