import { fileItem } from './types';
import type { NextApiRequest } from 'next';
import mimeType from 'mime-types';
// import fs from 'fs';
// import imageThumbnail from 'image-thumbnail';
// import { spawn } from 'child_process';
const ipv4Regex = /^(?:(?:\d|[1-9]\d|1\d{2}|2[0-4]\d|25[0-5])\.){3}(?:\d|[1-9]\d|1\d{2}|2[0-4]\d|25[0-5])$/;


export function formatBytes(bytes: number) {
	if (bytes == 0) return '0 Bytes';
	const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'],
		i = Math.floor(Math.log(bytes) / Math.log(1024));

	return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + ' ' + sizes[i];
}

export function getFileIcon(file: fileItem) {
	// Check folder stuff
	if (!file.extension && file.children) {
		return (file.children.filter(item => ['image', 'video'].includes((mimeType.lookup(item.extension) || '').split('/')[0])).length / file.children.length >= 0.60)
			? '<i class="far fa-images"></i>' : '<i class="far fa-folder"></i>';
	}

	// Get the icon from file type
	const type = mimeType.lookup(file.extension);
	if (type == false) return '<i class="far fa-file">';

	switch (type.split('/')[0]) {
		case 'image':
			return '<i class="far fa-file-image"></i>';
		case 'video':
			return '<i class="far fa-file-video"></i>';
		case 'text':
			return'<i class="far fa-file-alt"></i>';
		case 'music':
			return '<i class="fa-solid fa-file-music"></i>';
		default:
			return '<i class="far fa-file">';
	}
}

export function getIP(req: NextApiRequest) {
	if (req.headers) {
		// Standard headers used by Amazon EC2, Heroku, and others.
		if (ipv4Regex.test(req.headers['x-client-ip'] as string)) return req.headers['x-client-ip'];

		// CF-Connecting-IP - applied to every request to the origin. (Cloudflare)
		if (ipv4Regex.test(req.headers['cf-connecting-ip'] as string)) return req.headers['cf-connecting-ip'];

		// Fastly and Firebase hosting header (When forwared to cloud function)
		if (ipv4Regex.test(req.headers['fastly-client-ip'] as string)) return req.headers['fastly-client-ip'];

		// Akamai and Cloudflare: True-Client-IP.
		if (ipv4Regex.test(req.headers['true-client-ip'] as string)) return req.headers['true-client-ip'];

		// Default nginx proxy/fcgi; alternative to x-forwarded-for, used by some proxies.
		if (ipv4Regex.test(req.headers['x-real-ip'] as string)) return req.headers['x-real-ip'];

		// (Rackspace LB and Riverbed's Stingray)
		// http://www.rackspace.com/knowledge_center/article/controlling-access-to-linux-cloud-sites-based-on-the-client-ip-address
		// https://splash.riverbed.com/docs/DOC-1926
		if (ipv4Regex.test(req.headers['x-cluster-client-ip'] as string)) return req.headers['x-cluster-client-ip'];

		if (ipv4Regex.test(req.headers['x-forwarded'] as string)) return req.headers['x-forwarded'];

		if (ipv4Regex.test(req.headers['forwarded-for'] as string)) return req.headers['forwarded-for'];

		if (ipv4Regex.test(req.headers.forwarded as string)) return req.headers.forwarded;
	}

	// Remote address checks.
	if (req.socket && ipv4Regex.test(req.socket.remoteAddress as string)) {
		return req.socket.remoteAddress;
	}

	return undefined;
}

/*
export async function createThumbnail(path:string, name:string, fileType: string) {
	const options = { width: 200, height: 250, withMetaData: true, fit: 'inside', responseType: 'base64' };
	try {
		const thumbpath = decodeURI(process.cwd() + '/src/website/files/userContent/' + name);
		// Create thumbnail
		console.log(require('mime-types').lookup(fileType).split('/')[0]);
		switch (require('mime-types').lookup(fileType).split('/')[0]) {
			case 'image': {
				const thumbnail = await imageThumbnail(decodeURI(process.cwd() + '/src/website/files/userContent/' + `${name.split('.').slice(0, -1).join('.')}.${fileType}`), options);
				const img = Buffer.from(thumbnail, 'base64');

				// create the folders and file
				await fs.mkdirSync(path.split('/').slice(0, -1).join('/'), { recursive: true });
				await fs.writeFileSync(path, img);
				break;
			}
			case 'video': {
				// Create thumbnail from image
				await fs.mkdirSync(path.split('/').slice(0, -1).join('/'), { recursive: true });
				console.log(`New file: ${thumbpath.split('.').slice(0, -1).join('.')}.${fileType}`);
				const child = spawn('ffmpeg', ['-i', `${thumbpath.split('.').slice(0, -1).join('.')}.${fileType}`, '-ss', '00:00:01.000', '-vframes', '1', `${path.split('.').slice(0, -1).join('.')}-temp.jpg`]);
				child.stderr.on('data', (data: string) => {
					console.error(`ps stderr: ${data}`);
				});
				await new Promise((resolve, reject) => {
					child.on('close', resolve);
					child.on('error', (err: any) => {
						console.log(err);
						reject();
					});
				});
				// Compress thumbnail
				const thumbnail = await imageThumbnail(`${path.split('.').slice(0, -1).join('.')}-temp.jpg`, options);
				const img = Buffer.from(thumbnail, 'base64');
				await fs.writeFileSync(`${path.split('.').slice(0, -1).join('.')}.jpg`, img);

				// Delete temp file
				fs.unlinkSync(`${path.split('.').slice(0, -1).join('.')}-temp.jpg`);
			}
		}
	} catch (err) {
		console.log(err);
	}
}
*/
