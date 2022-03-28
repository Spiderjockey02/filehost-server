// JS for the custom video player ONLY
const video = document.getElementById('video'),
	videoControls = document.getElementById('video-controls'),
	playButton = document.getElementById('play'),
	playbackIcons = document.querySelectorAll('.playback-icons use'),
	timeElapsed = document.getElementById('time-elapsed'),
	duration = document.getElementById('duration'),
	progressBar = document.getElementById('seek-bar'),
	seek = document.getElementById('seek'),
	seekTooltip = document.getElementById('seek-tooltip'),
	volumeButton = document.getElementById('volume-button'),
	volumeIcons = document.querySelectorAll('.volume-button use'),
	volumeMute = document.querySelector('use[href="#volume-mute"]'),
	volumeLow = document.querySelector('use[href="#volume-low"]'),
	volumeHigh = document.querySelector('use[href="#volume-high"]'),
	settings = document.getElementById('settings-button'),
	volume = document.getElementById('volume'),
	settingsTab = document.getElementById('settings-tab'),
	playbackAnimation = document.getElementById('playback-animation'),
	fullscreenButton = document.getElementById('fullscreen-button'),
	videoContainer = document.getElementById('video-container'),
	fullscreenIcons = fullscreenButton.querySelectorAll('use'),
	playBack = document.getElementById('formControlRange'),
	pipButton = document.getElementById('pip-button');

const videoWorks = !!document.createElement('video').canPlayType;
if (videoWorks) {
	video.controls = false;
	videoControls.classList.remove('hidden');
}


document.getElementById('volume-controls').addEventListener("mouseover", function() {
	document.getElementById('volume').style.display = "block";
})

document.getElementById('volume-controls').addEventListener("mouseleave", function() {
	document.getElementById('volume').style.display = "none";
})
/* togglePlay toggles the playback state of the video.
If the video playback is paused or ended, the video is played
otherwise, the video is paused */
function togglePlay() {
	// alert('Start: ' + video.buffered.start(0) + ' End: ' + video.buffered.end(0));
	if (video.paused || video.ended) {
		video.play();
		console.log(	document.getElementsByTagName('track')[0].track.activeCues[0])
		document.getElementsByTagName('track')[0].track.activeCues[0].line = 50;
		//document.getElementsByTagName('track')[0].style['padding-bottom'] = "10%"; //[0].activeCues[0].line = -4;
	} else {
		video.pause();
	}
}

/* updatePlayButton updates the playback icon and tooltip
depending on the playback state */
function updatePlayButton() {
	playbackIcons.forEach((icon) => icon.classList.toggle('hidden'));
	playButton.setAttribute('data-title', video.paused ? 'Play (K)' : 'Pause (K)');
}

/* formatTime takes a time length in seconds and returns the time in minutes and seconds */
function formatTime(timeInSeconds) {
	const result = new Date(timeInSeconds * 1000).toISOString().substr(11, 8);

	return {
		minutes: result.substr(3, 2),
		seconds: result.substr(6, 2),
	};
}

// initializeVideo sets the video duration, and maximum value of the progressBar
function initializeVideo() {
	const videoDuration = video.duration;
	seek.setAttribute('max', videoDuration);
	const time = formatTime(videoDuration);
	duration.innerText = `${time.minutes}:${time.seconds}`;
	duration.setAttribute('datetime', `${time.minutes}m ${time.seconds}s`);
}

/* updateTimeElapsed indicates how far through the video
the current playback is by updating the timeElapsed element */
function updateTimeElapsed() {
	const time = formatTime(video.currentTime);
	timeElapsed.innerText = `${time.minutes}:${time.seconds}`;
	timeElapsed.setAttribute('datetime', `${time.minutes}m ${time.seconds}s`);
}

/* updateProgress indicates how far through the video
the current playback is by updating the progress bar */
function updateProgress() {
	seek.value = video.currentTime;
	progressBar.style.width = `${(video.currentTime / video.duration * 100) + 0.4}%`;
}

/* updateSeekTooltip uses the position of the mouse on the progress bar to
roughly work out what point in the video the user will skip to if
the progress bar is clicked at that point */
function updateSeekTooltip(event) {
	const skipTo = (event.offsetX / event.target.clientWidth) * event.target.getAttribute('max');
	seek.setAttribute('data-seek', skipTo);
	const t = formatTime(skipTo);
	seekTooltip.textContent = `${t.minutes}:${t.seconds}`;
	const rect = video.getBoundingClientRect();
	seekTooltip.style.left = `${event.pageX - rect.left}px`;
}

/* skipAhead jumps to a different point in the video,
when the progress bar is clicked */
function skipAhead(event, pressed) {
	let skipTo;
	if (pressed) {
		skipTo = event;
	} else {
		skipTo = event.target.dataset.seek ?? event.target.value;
	}
	seek.value = skipTo;
	video.currentTime = skipTo;
	progressBar.value = `${(skipTo / video.duration * 100) + 0.4}%`;
}

/* updateVolume updates the video's volume
and disables the muted state if active */
function updateVolume() {
	if (video.muted) video.muted = false;
	video.volume = volume.value;
}

/* updateVolumeIcon updates the volume icon so that it correctly reflects
the volume of the video */
function updateVolumeIcon() {
	volumeIcons.forEach((icon) => icon.classList.add('hidden'));
	volumeButton.setAttribute('data-title', 'Mute (m)');

	if (video.muted || video.volume === 0) {
		volumeMute.classList.remove('hidden');
		volumeButton.setAttribute('data-title', 'Unmute (m)');
	} else if (video.volume > 0 && video.volume <= 0.5) {
		volumeLow.classList.remove('hidden');
	} else {
		volumeHigh.classList.remove('hidden');
	}
}

/* toggleMute mutes or unmutes the video when executed
When the video is unmuted, the volume is returned to the value
it was set to before the video was muted */
function toggleMute() {
	video.muted = !video.muted;

	if (video.muted) {
		volume.setAttribute('data-volume', volume.value);
		volume.value = 0;
	} else {
		volume.value = volume.dataset.volume;
	}
}

/* animatePlayback displays an animation when
the video is played or paused */
function animatePlayback() {
	playbackAnimation.animate(
		[
			{ opacity: 1, transform: 'scale(1)' },
			{ opacity: 0, transform: 'scale(1.3)' },
		],
		{ duration: 500 },
	);
}

/* toggleFullScreen toggles the full screen state of the video
If the browser is currently in fullscreen mode,
then it should exit and vice versa. */
function toggleFullScreen() {
	if (document.fullscreenElement) {
		document.exitFullscreen();
	} else if (document.webkitFullscreenElement) {
		// Need this to support Safari
		document.webkitExitFullscreen();
	} else if (videoContainer.webkitRequestFullscreen) {
		// Need this to support Safari
		videoContainer.webkitRequestFullscreen();
	} else {
		videoContainer.requestFullscreen();
	}
	updateFullscreenButton(!document.fullscreenElement);
	hideControlsOnMobile();
}

function hideControlsOnMobile() {
	videoControls.classList.add('hide');
}

/* updateFullscreenButton changes the icon of the full screen button
and tooltip to reflect the current full screen state of the video */
function updateFullscreenButton(toggle) {
	fullscreenIcons.forEach((icon) => icon.classList.toggle('hidden'));
	if (toggle) {
		video.style['max-height'] = '100%';
		fullscreenButton.setAttribute('data-title', 'Exit full screen (f)');
	} else {
		video.style['max-height'] = '800px';
		fullscreenButton.setAttribute('data-title', 'Full screen (f)');
	}
}

// togglePip toggles Picture-in-Picture mode on the video
async function togglePip() {
	try {
		if (video !== document.pictureInPictureElement) {
			pipButton.disabled = true;
			await video.requestPictureInPicture();
		} else {
			await document.exitPictureInPicture();
		}
	} catch (error) {
		console.error(error);
	} finally {
		pipButton.disabled = false;
	}
}

/* hideControls hides the video controls when not in use
if the video is paused, the controls must remain visible */
function hideControls() {
	videoControls.classList.add('hide');
	settingsTab.classList.add('hide');
}

// showControls displays the video controls
function showControls() {
	videoControls.classList.remove('hide');
	settingsTab.classList.remove('hide');
}

/* keyboardShortcuts executes the relevant functions for
each supported shortcut key */
function keyboardShortcuts(event) {
	const { key } = event;
	switch (key) {
	case 'k':
	case ' ':
		togglePlay();
		animatePlayback();
		if (video.paused) {
			showControls();
		} else {
			setTimeout(() => {
				hideControls();
			}, 2000);
		}
		break;
	case 'm':
		toggleMute();
		break;
	case 'f':
		toggleFullScreen();
		break;
	case 'p':
		togglePip();
		break;
	case 'ArrowRight':
		if (video.currentTime == video.duration) return;
		skipAhead(Math.round(Number(seek.value) + 5), true);
		break;
	case 'ArrowLeft':
		if (video.currentTime == 0) return;
		skipAhead(Math.round(Number(seek.value) - 5), true);
		break;
	case 'ArrowUp':
		if (video.volume == 1) return;
		video.volume = (video.volume + 0.05).toFixed(3);
		volume.value = (Number(volume.value) + 0.05).toFixed(3);
		break;
	case 'ArrowDown':
		if (video.volume == 0) return;
		video.volume = (video.volume - 0.05).toFixed(3);
		volume.value = (Number(volume.value) - 0.05).toFixed(3);
		break;
	}
}

// Open/closes the settings tab
function togglesettingstab() {
	settingsTab.classList.toggle('hidden');
}

// Update the video's playback rate
function updatePlaybackSpeed() {
	document.getElementById('textInput').innerHTML = `Playback speed: ${playBack.value}x`;
	video.playbackRate = playBack.value;
}

// Add eventlisteners here
playButton.addEventListener('click', togglePlay);
settings.addEventListener('click', togglesettingstab);
video.addEventListener('play', updatePlayButton);
video.addEventListener('pause', updatePlayButton);
video.addEventListener('loadedmetadata', initializeVideo);
video.addEventListener('timeupdate', updateTimeElapsed);
video.addEventListener('timeupdate', updateProgress);
video.addEventListener('volumechange', updateVolumeIcon);
video.addEventListener('click', togglePlay);
video.addEventListener('click', animatePlayback);
video.addEventListener('mouseenter', showControls);
video.addEventListener('mouseleave', hideControls);
videoControls.addEventListener('mouseenter', showControls);
videoControls.addEventListener('mouseleave', hideControls);
seek.addEventListener('mousemove', updateSeekTooltip);
seek.addEventListener('input', skipAhead);
volume.addEventListener('input', updateVolume);
volumeButton.addEventListener('click', toggleMute);
fullscreenButton.addEventListener('click', toggleFullScreen);
pipButton.addEventListener('click', togglePip);
playBack.addEventListener('input', updatePlaybackSpeed);

document.addEventListener('DOMContentLoaded', () => {
	if (!('pictureInPictureEnabled' in document)) pipButton.classList.add('hidden');
});

document.addEventListener('keydown', keyboardShortcuts);

// display TimeRanges
video.addEventListener('progress', function() {
	if (video.buffered.length == 0) return;
	const bufferedEnd = video.buffered.end((video.buffered.length - 1) < video.buffered.length ? 0 : video.buffered.length - 1);
	const durationTime = video.duration;
	console.log(`[DEBUG] Time renderd: ${bufferedEnd} out of ${durationTime}`);
	if (durationTime > 0) document.getElementById('buffer').value = (bufferedEnd / durationTime) * 100;
});
