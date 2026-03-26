import { faFile, faFileAlt, faFileAudio, faFileImage, faFilePdf, faFileVideo, faFolder } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { MySQLConnectionOptions } from '@/types/database';
import type { File } from '@/types/generated/browser';
import en from 'javascript-time-ago/locale/en';
import TimeAgo from 'javascript-time-ago';
import { UAParser } from 'ua-parser-js';
import { NextRouter } from 'next/router';

TimeAgo.addDefaultLocale(en);
const timeAgo = new TimeAgo('en-US');

export function formatBytes(bytes?: number) {
	if (bytes == 0 || bytes == undefined) return '0 Bytes';
	const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'],
		i = Math.floor(Math.log(bytes) / Math.log(1024));

	return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + ' ' + sizes[i];
}

export function formatTime(seconds: number) {
	if (!isFinite(seconds)) return '0:00';
	const s = Math.floor(seconds % 60);
	const m = Math.floor(seconds / 60);
	return `${m}:${s.toString().padStart(2, '0')}`;
}

export function generatePlaceholderTable(rows: number, column: number) {
	return Array.from({ length: rows }, (_, i) => i).map((_, index) => (
		<tr key={index}>
			{Array.from({ length: column }, (__, i) => i).map((__) => (
				<td className="placeholder-glow" key={__}>
					<span className="placeholder col-12"></span>
				</td>
			))}
		</tr>
	));
}

export function getFileIcon(file: File) {
	// Check folder stuff
	if (file.type == 'DIRECTORY') return (<FontAwesomeIcon icon={faFolder} />) ;

	// Get the icon from file type
	if (file.mimetype == null) return <FontAwesomeIcon icon={faFile} />;
	if (file.mimetype == 'application/pdf') return <FontAwesomeIcon icon={faFilePdf} />;

	switch (file.mimetype.split('/')[0]) {
		case 'image':
			return <FontAwesomeIcon icon={faFileImage} />;
		case 'video':
			return <FontAwesomeIcon icon={faFileVideo} />;
		case 'text':
			return <FontAwesomeIcon icon={faFileAlt} />;
		case 'audio':
			return <FontAwesomeIcon icon={faFileAudio} />;
		default:
			return <FontAwesomeIcon icon={faFile} />;
	}
}

export function getStatusColor(startVal: number, maxValue?: number) {
	if (maxValue == undefined) return 'bg-success';

	if (startVal >= (0.9 * maxValue)) {
		return 'bg-danger';
	} else if (startVal >= (0.5 * maxValue)) {
		return 'bg-warning';
	} else {
		return 'bg-success';
	}
}

export function getRandomColor() {
	const r = Math.floor(Math.random() * 255);
	const g = Math.floor(Math.random() * 255);
	const b = Math.floor(Math.random() * 255);
	return `rgb(${r}, ${g}, ${b})`;
}

export function parseUserAgent(userAgent?: string | null) {
	if (userAgent == null) return '';
	const parser = new UAParser(userAgent);
	const browser = parser.getBrowser();
	const os = parser.getOS();

	return `${browser.name} ${browser.version} on ${os.name} ${os.version}`;
}

export function convertMiliseconds(miliseconds: number) {
	const	total_seconds = Math.floor(miliseconds);
	const	total_minutes = Math.floor(total_seconds / 60);
	const	total_hours = Math.floor(total_minutes / 60);
	const	days = Math.floor(total_hours / 24);

	const	seconds = total_seconds % 60;
	const	minutes = total_minutes % 60;
	const	hours = total_hours % 24;

	let formatText = '';
	if (days > 0) formatText = formatText.concat(`${days} day${(days > 1) ? 's' : ''} `);
	if (hours > 0) formatText = formatText.concat(`${hours} hour${(hours > 1) ? 's' : ''} `);
	if (minutes > 0) formatText = formatText.concat(`${minutes} minute${(minutes > 1) ? 's' : ''} `);
	if (days <= 1 && hours <= 1 && seconds > 0) formatText = formatText.concat(`${seconds} second${(seconds > 1) ? 's' : ''}`);

	return formatText;
};

export function format(text: Date | number) {
	if ((typeof text == 'number' && isNaN(text)) || text == null) return 'N/A';
	return timeAgo.format(text);
}

export const queryOptions = {
	refetchOnWindowFocus: true,
	retry: 1,
	retryDelay: 1000,
	// After 5 minutes data is stale
	staleTime: 1000 * 60 * 5,
};

export function signOutOptions(router: NextRouter) {
	return {
		fetchOptions: {
			onSuccess: () => {
				router.push('/login');
			},
		},
	};
}

export function parseMySQLConnectionString(connectionString: string): MySQLConnectionOptions {
	const regex = /^mysql:\/\/([^:]+):([^/]+)@([^/:]+):(\d+)\/(.+)$/;
	const match = connectionString.match(regex);

	if (!match) throw 'Invalid MySQL connection string format';
	const [, username, password, host, port, database] = match;
	return { username, password, host, database, port: parseInt(port, 10) };
}