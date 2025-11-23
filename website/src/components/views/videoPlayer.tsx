import { faCompress, faExpand, faGear, faPause, faPlay, faVolumeHigh, faVolumeLow, faVolumeOff, faWindowMaximize } from '@fortawesome/free-solid-svg-icons';
import type { KeyboardEvent, ChangeEvent, MouseEvent } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { VideoPlayerProps } from '@/types/Components/Views';
import styles from '@/styles/VideoPlayer.module.css';
import { formatTime } from '@/utils/functions';
import { useRef } from 'react';

export default function VideoPlayer({ userId, path }: VideoPlayerProps) {
	// Buttons and anything that can change
	const video = useRef<HTMLVideoElement>(null);
	const videoContainer = useRef<HTMLDivElement>(null);
	const videoControls = useRef<HTMLDivElement>(null);
	const duration = useRef<HTMLTimeElement>(null);
	const seek = useRef<HTMLInputElement>(null);
	const timeElapsed = useRef<HTMLTimeElement>(null);
	const progressBar = useRef<HTMLDivElement>(null);
	const seekTooltip = useRef<HTMLDivElement>(null);
	const buffer = useRef<HTMLProgressElement>(null);
	const volume = useRef<HTMLInputElement>(null);
	const fullscreenBtn = useRef<HTMLButtonElement>(null);
	const pipButton = useRef<HTMLButtonElement>(null);
	const settingsTab = useRef<HTMLDivElement>(null);
	const playbackText = useRef<HTMLLabelElement>(null);
	const volumeButton = useRef<HTMLButtonElement>(null);

	// Icons
	const fullscreenBtns = useRef<Array<SVGElement | null>>([]);
	const playBtnIcons = useRef<Array<SVGElement | null>>([]);
	const volumnBtnIcons = useRef<Array<SVGElement | null>>([]);
	const playIcons = useRef<(SVGElement | null)[]>([]);

	// Initalise the video (Get duration)
	function initVideo() {
		const videoDuration = (video.current as HTMLVideoElement).duration;
		seek.current?.setAttribute('max', `${videoDuration}`);
		const time = formatTime(videoDuration);
		(duration.current as HTMLTimeElement).innerText = `${time.minutes}:${time.seconds}`;
		(duration.current as HTMLTimeElement).setAttribute('datetime', `${time.minutes}m ${time.seconds}s`);
	}

	// Update seek time
	function updateSeekTime(event: ChangeEvent<HTMLInputElement>) {
		const skipTo = event.target.dataset.seek ?? event.target.value;
		(seek.current as HTMLInputElement).value = skipTo;
		(video.current as HTMLVideoElement).currentTime = Number(skipTo);
	}

	// Update all text that displays seek time
	function timeUpdate() {
		const time = formatTime((video.current as HTMLVideoElement).currentTime);
		(timeElapsed.current as HTMLTimeElement).innerText = `${time.minutes}:${time.seconds}`;
		(timeElapsed.current as HTMLTimeElement).setAttribute('datetime', `${time.minutes}m ${time.seconds}s`);

		(seek.current as HTMLInputElement).value = `${(video.current as HTMLVideoElement).currentTime}`;
		(progressBar.current as HTMLDivElement).style.width = `${((video.current as HTMLVideoElement).currentTime / (video.current as HTMLVideoElement).duration * 100) + 0.4}%`;
	}

	// Update seek tooltip and relevant information
	function updateSeekTooltip(event: MouseEvent<HTMLDivElement>) {
		const skipTo = (event.nativeEvent.offsetX / (event.target as HTMLDivElement).clientWidth) * Number((event.target as HTMLDivElement).getAttribute('max'));
		(seek.current as HTMLInputElement).setAttribute('data-seek', `${skipTo}`);
		const t = formatTime(skipTo);
		(seekTooltip.current as HTMLDivElement).textContent = `${t.minutes}:${t.seconds}`;
		const rect = (video.current as HTMLVideoElement).getBoundingClientRect();
		(seekTooltip.current as HTMLDivElement).style.left = `${event.pageX - rect.left}px`;
	}

	// Toggle play/pause state
	function togglePlay() {
		if (video.current == null) return;
		playBtnIcons.current.forEach((icon) => icon?.classList.toggle(styles.hidden));
		playIcons.current.forEach((icon) => icon?.classList.toggle(styles.hidden));
		if (video.current.paused || video.current.ended) {
			video.current.play();
		} else {
			video.current.pause();
		}
	}

	// Update the volume icons
	function updateVolumeIcon() {
		const vid = (video.current as HTMLVideoElement);
		const volumeIcons = volumnBtnIcons.current;
		volumeIcons.forEach((icon) => icon?.classList.add(styles.hidden));
		volumeButton.current?.setAttribute('data-title', 'Mute (m)');

		if (vid.muted || vid.volume === 0) {
			volumeIcons[0]?.classList.remove(styles.hidden);
			volumeButton.current?.setAttribute('data-title', 'Unmute (m)');
		} else if (vid.volume > 0 && vid.volume <= 0.5) {
			volumeIcons[1]?.classList.remove(styles.hidden);
		} else {
			volumeIcons[2]?.classList.remove(styles.hidden);
		}
		(volume.current as HTMLInputElement).value = `${vid.volume}`;
	}

	// Toggle mute
	function toggleMute() {
		const vid = (video.current as HTMLVideoElement);
		const vol = (volume.current as HTMLInputElement);
		vid.muted = !vid.muted;
		if (vid.muted) {
			vol.setAttribute('data-volume', vol.value);
			vol.value = `${0}`;
		} else {
			vol.value = `${vol.dataset.volume}`;
		}
	}

	// Update video progress (current time etc)
	function updateProgress() {
		const vid = (video.current as HTMLVideoElement);
		if (vid.buffered.length == 0) return;
		const bufferedEnd = vid.buffered.end(vid.buffered.length - 1);
		const durationTime = vid.duration;
		console.log(`[DEBUG] Time renderd: ${bufferedEnd} out of ${durationTime}`);
		if (durationTime > 0) (buffer.current as HTMLProgressElement).value = (bufferedEnd / durationTime) * 100;
	}

	// Toggle full screen mode
	function toggleFullScreen() {
		const container = (videoContainer.current as HTMLDivElement);
		if (document.fullscreenElement) {
			document.exitFullscreen();
		} else {
			container.requestFullscreen();
		}
		updateFullscreenButton(!document.fullscreenElement);
	}

	// Toggle the picture=in-picture mode
	async function togglePip() {
		const vid = (video.current as HTMLVideoElement);
		try {
			if (vid !== document.pictureInPictureElement) {
				(pipButton.current as HTMLButtonElement).disabled = true;
				await vid.requestPictureInPicture();
			} else {
				await document.exitPictureInPicture();
			}
		} catch (error) {
			console.error(error);
		} finally {
			(pipButton.current as HTMLButtonElement).disabled = false;
		}
	}

	// Update the fullscreen buttons
	function updateFullscreenButton(toggle: boolean) {
		fullscreenBtns.current?.forEach((icon) => icon?.classList.toggle(styles.hidden));
		if (toggle) {
			(video.current as HTMLVideoElement).style.maxHeight = '100%';
			fullscreenBtn.current?.setAttribute('data-title', 'Exit full screen (f)');
		} else {
			(video.current as HTMLVideoElement).style.maxHeight = '800px';
			fullscreenBtn.current?.setAttribute('data-title', 'Full screen (f)');
		}
	}

	function handleKeyPress(e: KeyboardEvent<HTMLDivElement>) {
		e.preventDefault();
		// 75,32 = k (or space), 77 = m, p= 80, 83 = s
		switch(e.keyCode) {
			case 75:
			case 32:
				return togglePlay();
			case 77:
				return toggleMute();
			case 80:
				return togglePip();
			case 83:
				return toggleSettings();
			case 70:
				return toggleFullScreen();
		}
	}

	// Toggle settings tab visibility
	function toggleSettings() {
		const settingsDiv = settingsTab.current as HTMLDivElement;
		if (settingsDiv.style.display === 'none') {
			settingsDiv.style.display = 'block';
		} else {
			settingsDiv.style.display = 'none';
		}
	}

	// Update the playback speed
	function updatePlaybackSpeed(e: ChangeEvent<HTMLInputElement>) {
		const speed = e.target.value;
		const curVideo = video.current as HTMLVideoElement;
		const label = playbackText.current as HTMLLabelElement;
		curVideo.playbackRate = Number(speed);
		label.textContent = `Playback speed: ${speed}x`;
	}

	// On mouse enter, show the volume slider
	function showVolumeBar() {
		const volumeBar = volume.current as HTMLInputElement;
		volumeBar.classList.remove(styles.hidden);
	}

	// On mouse leave, hide the volume slider
	function hideVolumeBar() {
		const volumeBar = volume.current as HTMLInputElement;
		volumeBar.classList.add(styles.hidden);
	}

	return (
		<>
			<div className={styles.video_container} tabIndex={0} ref={videoContainer} onKeyDown={handleKeyPress}>
				<video className={styles.video} preload="metadata" poster={`/thumbnail/${userId}/${path}`} ref={video}
					onLoadedMetadata={initVideo} onTimeUpdate={timeUpdate} onClick={togglePlay} onProgress={updateProgress} onVolumeChange={updateVolumeIcon}>
					<source src={`/content/${userId}/${encodeURI(path)}`} />
				</video>
				<div className={`${styles.video_controls}`} ref={videoControls}>
					<div className={styles.video_progress}>
						<div className={`${styles.progress_bar} ${styles.seek_bar}`} style={{ width: '0%' }} ref={progressBar}></div>
						<input className={`${styles.input_range} ${styles.seek}`} ref={seek} defaultValue="0" min="0" type="range" step="0.01" onChange={updateSeekTime}/>
						<progress className={`${styles.progress_bar} ${styles.buffer}`} defaultValue="0" max="100" ref={buffer} />
						<div className={styles.hidden} ref={seekTooltip} onMouseMove={updateSeekTooltip}>00:00</div>
					</div>
					<div className={styles.bottom_controls}>
						<div className={styles.left_controls}>
							<button className={styles.button} data-title="Play (k)" onClick={togglePlay}>
								<FontAwesomeIcon icon={faPlay} className={styles.icon} ref={(i) => {if (i) playBtnIcons.current[0] = i;}} />
								<FontAwesomeIcon icon={faPause} className={`${styles.icon} ${styles.hidden}`} ref={i =>{if (i) playBtnIcons.current[1] = i;}} />
							</button>
							<div className={styles.volume_controls} onMouseEnter={showVolumeBar} onMouseLeave={hideVolumeBar}>
								<button className={styles.button} ref={volumeButton} data-title="Mute (m)" onClick={toggleMute}>
									<FontAwesomeIcon icon={faVolumeOff} className={`${styles.icon} ${styles.hidden}`} ref={i => {if (i) volumnBtnIcons.current[0] = i;}} />
									<FontAwesomeIcon icon={faVolumeLow} className={`${styles.icon} ${styles.hidden}`} ref={i => {if (i) volumnBtnIcons.current[1] = i;}} />
									<FontAwesomeIcon icon={faVolumeHigh} className={styles.icon} ref={i => {if (i) volumnBtnIcons.current[2] = i;}} />
								</button>
								<input className={`${styles.volume} ${styles.hidden}`} defaultValue="1" type="range" max="1" min="0" step="0.05" ref={volume} onInput={(i) => (video.current as HTMLVideoElement).volume = Number(i.currentTarget.value)}/>
							</div>
							<div>
								<time ref={timeElapsed}>00:00</time>
								<span> / </span>
								<time ref={duration}>00:00</time>
							</div>
						</div>
						<div>
							<button className={`${styles.button} ${styles.pip_button}`} data-title="PIP (p)" ref={pipButton} onClick={togglePip}>
								<FontAwesomeIcon icon={faWindowMaximize} className={styles.icon} />
							</button>
							<button data-title="Settings (s)" className={styles.button} onClick={toggleSettings}>
								<FontAwesomeIcon className={styles.icon} icon={faGear} />
							</button>
							<button data-title="Full screen (f)" className={`${styles.button} ${styles.fullscreen_button}`} ref={fullscreenBtn} onClick={toggleFullScreen}>
								<FontAwesomeIcon className={styles.icon} icon={faExpand} ref={i => {if (i) fullscreenBtns.current[0] = i;}} />
								<FontAwesomeIcon className={`${styles.icon} ${styles.hidden}`} icon={faCompress} ref={i => {if (i) fullscreenBtns.current[1] = i;}} />
							</button>
						</div>
					</div>
					<div className={`${styles.settings_popup}`} ref={settingsTab} style={{ display: 'none' }}>
						<div>
							<label htmlFor="playbackSpeed" ref={playbackText}>Playback speed: 1.0x</label>
							<input type="range" id="playbackSpeed" defaultValue="1" max="2" step="0.50" onChange={(e) => updatePlaybackSpeed(e)}/>
						</div>
					</div>
				</div>
			</div>
		</>
	);
}