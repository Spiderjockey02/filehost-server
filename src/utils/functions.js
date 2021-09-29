// turn bytes to data string (1024 => 1KB)
module.exports.formatBytes = (bytes) => {
	if (bytes === 0) return '0 Bytes';
	const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'],
		i = Math.floor(Math.log(bytes) / Math.log(1024));

	return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + ' ' + sizes[i];
};

module.exports.getFileIcon = (file) => {
	if (['.mp4', '.mov'].includes(file.extension)) {
		// video file
		return '<i class="far fa-file-video"></i>';
	} else if (['.json'].includes(file.extension)) {
		// text file
		return '<i class="far fa-file-alt"></i>';
	} else if (['.png', '.jpg', 'jpeg'].includes(file.extension)) {
		// picture
		return '<i class="far fa-file-image"></i>';
	} else if (!file.extension && file.children) {
		if (file.children.filter(item => ['.png', '.jpg', 'jpeg'].includes(item.extension)).length / file.children.length >= 0.60) {
			return '<i class="far fa-images"></i>';
		}
		return '<i class="far fa-folder"></i>';
	}

	// default file icon
	return '<i class="far fa-file">';

};
