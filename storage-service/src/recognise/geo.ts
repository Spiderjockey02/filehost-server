import geoReverse from 'geo-reverse';
import fs from 'fs';
import exifer from 'exifer';
import gps from '@exifer/gps';
import mimeType from 'mime-types';
import { Logger } from '../utils';

export default class Landmarks {
	/**
	 * Function for getting Geo metadata from file
	 * @param {string} path The path to file for analyse
	*/
	async run(path: string) {
		Logger.debug(`Getting Geo metadata from file: ${path}`);
		try {
			// Only allow images to be analysed
			const fileType = mimeType.lookup(path);
			if (fileType == false || fileType.split('/')[0] !== 'image') return [];

			// Get the GPS data from the file
			const metadata = await exifer(fs.readFileSync(path), { tags: { gps } });
			if (metadata.GPSAltitude && metadata.GPSLongitude) {
				const lat = this.convertDMSToDD(metadata.GPSLatitude, metadata.GPSLatitudeRef);
				const long = this.convertDMSToDD(metadata.GPSLongitude, metadata.GPSLongitudeRef);
				const countries = geoReverse.country(lat, long, 'en');
				return countries.map(c => ({ name: c.name, lat, long }));
			} else {
				return [];
			}
		} catch (e: unknown) {
			Logger.error(`GEO: ${JSON.stringify(e)}`);
			return [];
		}
	}

	convertDMSToDD([degrees, minutes, seconds]: Array<number>, direction: string) {
		let dd = degrees + minutes / 60 + seconds / (60 * 60);
		if (direction === 'South' || direction === 'West') 	dd = dd * -1;
		return dd;
	}
}
