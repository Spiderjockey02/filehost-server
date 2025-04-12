import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { fileItem } from '../types';
import mimeType from 'mime-types';
import { faFile, faFileAlt, faFileImage, faFilePdf, faFileVideo, faFolder, faMusic } from '@fortawesome/free-solid-svg-icons';

export function formatBytes(bytes: number) {
	if (bytes == 0) return '0 Bytes';
	const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'],
		i = Math.floor(Math.log(bytes) / Math.log(1024));

	return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + ' ' + sizes[i];
}

export function formatTime(timeInSeconds: number) {
	const result = new Date((isNaN(timeInSeconds) ? 1 : timeInSeconds) * 1000).toISOString().substr(11, 8);
	return {
		minutes: result.substr(3, 2),
		seconds: result.substr(6, 2),
	};
}

export function getFileIcon(file: fileItem) {
	// Check folder stuff
	if (file.type == 'DIRECTORY') return (<FontAwesomeIcon icon={faFolder} />) ;

	// Get the icon from file type
	const type = mimeType.lookup(file.name);
	if (type == false) return <FontAwesomeIcon icon={faFile} />;

	if (type == 'application/pdf') return <FontAwesomeIcon icon={faFilePdf} />;

	switch (type.split('/')[0]) {
		case 'image':
			return <FontAwesomeIcon icon={faFileImage} />;
		case 'video':
			return <FontAwesomeIcon icon={faFileVideo} />;
		case 'text':
			return <FontAwesomeIcon icon={faFileAlt} />;
		case 'music':
			return <FontAwesomeIcon icon={faMusic} />;
		default:
			return <FontAwesomeIcon icon={faFile} />;
	}
}

export function getStatusColor(startVal: number, maxValue: number) {
	if (startVal >= (0.9 * maxValue)) {
		return 'bg-danger';
	} else if (startVal >= (0.5 * maxValue)) {
		return 'bg-warning';
	} else {
		return 'bg-success';
	}
}