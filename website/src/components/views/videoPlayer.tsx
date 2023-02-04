import type { fileItem } from '../../utils/types';
import { useState, useEffect } from 'react';
// import type { HTMLVideoElement } from 'typescript/lib/lib.dom.d';
// import '../styles/videoplayer.module.css';
interface Props {
  files: fileItem
}


export default function DisplayFile({ files }: Props) {
	useEffect(() => {
		const video = (document.getElementById('video') as any),
  	videoControls = (document.getElementById('video-controls') as any),
  	playButton = (document.getElementById('play') as any),
  	playbackIcons = (document.querySelectorAll('.playback-icons use') as any),
  	timeElapsed = document.getElementById('time-elapsed'),
  	duration = (document.getElementById('duration') as any),
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
  	fullscreenButton = (document.getElementById('fullscreen-button') as any),
  	videoContainer = document.getElementById('video-container'),
  	fullscreenIcons = fullscreenButton.querySelectorAll('use'),
  	playBack = document.getElementById('formControlRange'),
  	pipButton = document.getElementById('pip-button');

		const videoWorks = !!document.createElement('video').canPlayType;
		if (videoWorks) {
  	video.controls = false;
  	videoControls.classList.remove('hidden');
		}


		document.getElementById('volume-controls')?.addEventListener('mouseover', function() {
			(document.getElementById('volume') as any).style.display = 'block';
		});

		document.getElementById('volume-controls')?.addEventListener('mouseleave', function() {
  	  (document.getElementById('volume') as any).style.display = 'none';
		});
		/* togglePlay toggles the playback state of the video.
  If the video playback is paused or ended, the video is played
  otherwise, the video is paused */
		function togglePlay() {
    	// alert('Start: ' + video.buffered.start(0) + ' End: ' + video.buffered.end(0));
    	if (video.paused || video.ended) {
    		video.play();
    	} else {
    		video.pause();
    	}
		}

		/* updatePlayButton updates the playback icon and tooltip
  depending on the playback state */
		function updatePlayButton() {
  	playbackIcons.forEach((icon: any) => icon.classList.toggle('hidden'));
  	playButton.setAttribute('data-title', video.paused ? 'Play (K)' : 'Pause (K)');
		}

		/* formatTime takes a time length in seconds and returns the time in minutes and seconds */
		function formatTime(timeInSeconds: number) {
  	const result = new Date(timeInSeconds * 1000).toISOString().substr(11, 8);

  	return {
  		minutes: result.substr(3, 2),
  		seconds: result.substr(6, 2),
  	};
		}

		// initializeVideo sets the video duration, and maximum value of the progressBar
		function initializeVideo() {
    	const videoDuration = video.duration;
    	seek?.setAttribute('max', videoDuration);
    	const time = formatTime(videoDuration);
    	duration.innerText = `${time.minutes}:${time.seconds}`;
    	duration.setAttribute('datetime', `${time.minutes}m ${time.seconds}s`);
		}

		/* updateTimeElapsed indicates how far through the video
  the current playback is by updating the timeElapsed element */
		function updateTimeElapsed() {
  	const time = formatTime(video.currentTime);
  	(timeElapsed as any).innerText = `${time.minutes}:${time.seconds}`;
  	timeElapsed?.setAttribute('datetime', `${time.minutes}m ${time.seconds}s`);
		}

		/* updateProgress indicates how far through the video
  the current playback is by updating the progress bar */
		function updateProgress() {
  	  (seek as any).value = video.currentTime;
  	  (progressBar as any).style.width = `${(video.currentTime / video.duration * 100) + 0.4}%`;
		}

		/* updateSeekTooltip uses the position of the mouse on the progress bar to
  roughly work out what point in the video the user will skip to if
  the progress bar is clicked at that point */
		function updateSeekTooltip(event: any) {
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
	});

	return (
		<>
			<link rel="stylesheet" href="http://192.168.0.14:3000/videoplayer.module.css" />
			<div className="video-container" id="video-container">
				<div className="playback-animation" id="playback-animation">
					<svg className="svg playback-icons">
						<use className="hidden" href="#play-icon"></use>
						<use href="#pause"></use>
					</svg>
				</div>
				<video className="video" id="video" preload="metadata">
					<source src={`http://192.168.0.14:3000/api/uploads/${files.name}`} type="video/mp4" />
				</video>
				<div id="settings-tab" className="video-controls hidden">
					<div className="form-group">
						<label htmlFor="formControlRange" id="textInput">Playback speed: 1.0x</label>
						<input type="range" className="input-range form-control-range bg-dark" id="formControlRange" value="1" max="2" step="0.50" />
					</div>
				</div>
				<div className="video-controls" id="video-controls">
					<div className="video-progress">
						<div className="progress-bar" id="seek-bar"></div>
						<input className="input-range seek" id="seek" value="0" min="0" type="range" step="0.01" />
						<progress className="progress-bar" id="buffer" value="0" max="100"></progress>
						<div className="seek-tooltip" id="seek-tooltip">00:00</div>
					</div>
					<div className="bottom-controls">
						<div className="left-controls">
							<button className="button" data-title="Play (k)" id="play">
								<svg className="svg playback-icons">
									<use href="#play-icon"></use>
									<use className="hidden" href="#pause"></use>
								</svg>
							</button>
							<div className="volume-controls" id="volume-controls">
								<button className="button volume-button" data-title="Mute (m)" id="volume-button">
									<svg className="svg">
										<use className="hidden" href="#volume-mute"></use>
										<use className="hidden" href="#volume-low"></use>
										<use href="#volume-high"></use>
									</svg>
								</button>
								<input className="input-range volume" id="volume" value="1" data-mute="0.5" type="range" max="1" min="0" step="0.05" />
							</div>
							<div className="time">
								<time id="time-elapsed">00:00</time>
								<span> / </span>
								<time id="duration">00:00</time>
							</div>
						</div>
						<div className="right-controls">
							<button className="button pip-button" data-title="PIP (p)" id="pip-button">
								<svg className="svg">
									<use href="#pip"></use>
								</svg>
							</button>
							<button data-title="Settings (s)" className="settings-button" id="settings-button">
								<svg className="svg">
									<use href="#gear"></use>
								</svg>
							</button>
							<button data-title="Full screen (f)" className="fullscreen-button" id="fullscreen-button">
								<svg className="svg">
									<use href="#fullscreen"></use>
									<use href="#fullscreen-exit" className="hidden"></use>
								</svg>
							</button>
						</div>
					</div>
				</div>
			</div>
			<svg className="svg" style={{ display: 'none' }}>
				<defs>
					<symbol id="pause" viewBox="0 0 24 24">
						<path d="M14.016 5.016h3.984v13.969h-3.984v-13.969zM6 18.984v-13.969h3.984v13.969h-3.984z"></path>
					</symbol>
					<symbol id="play-icon" viewBox="0 0 24 24">
						<path d="M8.016 5.016l10.969 6.984-10.969 6.984v-13.969z"></path>
					</symbol>
					<symbol id="volume-high" viewBox="0 0 24 24">
						<path d="M14.016 3.234q3.047 0.656 5.016 3.117t1.969 5.648-1.969 5.648-5.016 3.117v-2.063q2.203-0.656 3.586-2.484t1.383-4.219-1.383-4.219-3.586-2.484v-2.063zM16.5 12q0 2.813-2.484 4.031v-8.063q1.031 0.516 1.758 1.688t0.727 2.344zM3 9h3.984l5.016-5.016v16.031l-5.016-5.016h-3.984v-6z"></path>
					</symbol>
					<symbol id="volume-low" viewBox="0 0 24 24">
						<path d="M5.016 9h3.984l5.016-5.016v16.031l-5.016-5.016h-3.984v-6zM18.516 12q0 2.766-2.531 4.031v-8.063q1.031 0.516 1.781 1.711t0.75 2.32z"></path>
					</symbol>
					<symbol id="volume-mute" viewBox="0 0 24 24">
						<path d="M12 3.984v4.219l-2.109-2.109zM4.266 3l16.734 16.734-1.266 1.266-2.063-2.063q-1.547 1.313-3.656 1.828v-2.063q1.172-0.328 2.25-1.172l-4.266-4.266v6.75l-5.016-5.016h-3.984v-6h4.734l-4.734-4.734zM18.984 12q0-2.391-1.383-4.219t-3.586-2.484v-2.063q3.047 0.656 5.016 3.117t1.969 5.648q0 2.203-1.031 4.172l-1.5-1.547q0.516-1.266 0.516-2.625zM16.5 12q0 0.422-0.047 0.609l-2.438-2.438v-2.203q1.031 0.516 1.758 1.688t0.727 2.344z"></path>
					</symbol>
					<symbol id="fullscreen" viewBox="0 0 24 24">
						<path d="M14.016 5.016h4.969v4.969h-1.969v-3h-3v-1.969zM17.016 17.016v-3h1.969v4.969h-4.969v-1.969h3zM5.016 9.984v-4.969h4.969v1.969h-3v3h-1.969zM6.984 14.016v3h3v1.969h-4.969v-4.969h1.969z"></path>
					</symbol>
					<symbol id="fullscreen-exit" viewBox="0 0 24 24">
						<path d="M15.984 8.016h3v1.969h-4.969v-4.969h1.969v3zM14.016 18.984v-4.969h4.969v1.969h-3v3h-1.969zM8.016 8.016v-3h1.969v4.969h-4.969v-1.969h3zM5.016 15.984v-1.969h4.969v4.969h-1.969v-3h-3z"></path>
					</symbol>
					<symbol id="pip" viewBox="0 0 24 24">
						<path d="M21 19.031v-14.063h-18v14.063h18zM23.016 18.984q0 0.797-0.609 1.406t-1.406 0.609h-18q-0.797 0-1.406-0.609t-0.609-1.406v-14.016q0-0.797 0.609-1.383t1.406-0.586h18q0.797 0 1.406 0.586t0.609 1.383v14.016zM18.984 11.016v6h-7.969v-6h7.969z"></path>
					</symbol>
					<symbol id="gear" viewBox="0 0 24 24">
						<path d="M24 13.616v-3.232l-2.869-1.02c-.198-.687-.472-1.342-.811-1.955l1.308-2.751-2.285-2.285-2.751 1.307c-.613-.339-1.269-.613-1.955-.811l-1.021-2.869h-3.232l-1.021 2.869c-.686.198-1.342.471-1.955.811l-2.751-1.308-2.285 2.285 1.308 2.752c-.339.613-.614 1.268-.811 1.955l-2.869 1.02v3.232l2.869 1.02c.197.687.472 1.342.811 1.955l-1.308 2.751 2.285 2.286 2.751-1.308c.613.339 1.269.613 1.955.811l1.021 2.869h3.232l1.021-2.869c.687-.198 1.342-.472 1.955-.811l2.751 1.308 2.285-2.286-1.308-2.751c.339-.613.613-1.268.811-1.955l2.869-1.02zm-12 2.384c-2.209 0-4-1.791-4-4s1.791-4 4-4 4 1.791 4 4-1.791 4-4 4z"/>
					</symbol>
				</defs>
			</svg>
		</>
	);
}
