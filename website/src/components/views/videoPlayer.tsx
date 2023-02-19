import type { User } from '@prisma/client';
import { useRef } from 'react';
import Script from 'next/script';
interface Props {
  dir: string
  user: User
}

export default function DisplayFile({ dir, user }: Props) {
	const video = useRef<HTMLVideoElement>(null);
	const videoContainer = useRef<HTMLDivElement>(null);
	const duration = useRef<HTMLTimeElement>(null);
	const seek = useRef<HTMLInputElement>(null);
	const timeElapsed = useRef<HTMLTimeElement>(null);
	const progressBar = useRef<HTMLDivElement>(null);
	const playbackAnimation = useRef<HTMLDivElement>(null);
	const seekTooltip = useRef<HTMLDivElement>(null);
	const buffer = useRef<HTMLProgressElement>(null);
	const volume = useRef<HTMLInputElement>(null);

	function formatTime(timeInSeconds: number) {
		const result = new Date(timeInSeconds * 1000).toISOString().substr(11, 8);
		return {
			minutes: result.substr(3, 2),
			seconds: result.substr(6, 2),
		};
	}

	function initVideo() {
		const videoDuration = (video.current as HTMLVideoElement).duration;
		seek.current?.setAttribute('max', `${videoDuration}`);
		const time = formatTime(videoDuration);
		(duration.current as HTMLTimeElement).innerText = `${time.minutes}:${time.seconds}`;
		(duration.current as HTMLTimeElement).setAttribute('datetime', `${time.minutes}m ${time.seconds}s`);
	}

	function skipAhead(event: any, pressed = false) {
		const skipTo = (pressed) ? event : (event.target.dataset.seek ?? event.target.value);
		(seek.current as HTMLInputElement).value = skipTo;
		(video.current as HTMLVideoElement).currentTime = skipTo;
	}

	function clickedVideo() {
		togglePlay();

		// Animate
		(playbackAnimation.current as HTMLDivElement).animate(
			[
				{ opacity: 1, transform: 'scale(1)' },
				{ opacity: 0, transform: 'scale(1.3)' },
			],
			{ duration: 500 },
		);
	}

	function timeUpdate() {
		const time = formatTime((video.current as HTMLVideoElement).currentTime);
		(timeElapsed.current as HTMLTimeElement).innerText = `${time.minutes}:${time.seconds}`;
		(timeElapsed.current as HTMLTimeElement).setAttribute('datetime', `${time.minutes}m ${time.seconds}s`);

		(seek.current as HTMLInputElement).value = `${(video.current as HTMLVideoElement).currentTime}`;
		(progressBar.current as HTMLDivElement).style.width = `${((video.current as HTMLVideoElement).currentTime / (video.current as HTMLVideoElement).duration * 100) + 0.4}%`;
	}

	function updateSeekTooltip(event: any) {
		const skipTo = (event.offsetX / (event.target as HTMLDivElement).clientWidth) * Number((event.target as HTMLDivElement).getAttribute('max'));
		(seek.current as HTMLInputElement).setAttribute('data-seek', `${skipTo}`);
		const t = formatTime(skipTo);
		(seekTooltip.current as HTMLDivElement).textContent = `${t.minutes}:${t.seconds}`;
		const rect = (video.current as HTMLVideoElement).getBoundingClientRect();
		(seekTooltip.current as HTMLDivElement).style.left = `${event.pageX - rect.left}px`;
	}

	function togglePlay() {
		if (video.current == null) return;
		if (video.current.paused || video.current.ended) {
			video.current.play();
		} else {
			video.current.pause();
		}
	}

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

	function updateProgress() {
		const vid = (video.current as HTMLVideoElement);
		if (vid.buffered.length == 0) return;
		const bufferedEnd = vid.buffered.end(vid.buffered.length - 1);
		const durationTime = vid.duration;
		console.log(`[DEBUG] Time renderd: ${bufferedEnd} out of ${durationTime}`);
		if (durationTime > 0) (buffer.current as HTMLProgressElement).value = (bufferedEnd / durationTime) * 100;
	}

	function toggleFullScreen() {
		const container = (videoContainer.current as HTMLDivElement);
		if (document.fullscreenElement) {
			document.exitFullscreen();
		} else {
			container.requestFullscreen();
		}
		// updateFullscreenButton(!document.fullscreenElement);
		// hideControlsOnMobile();
	}

	if (status == 'loading') return null;
	return (
		<>
			<link rel="stylesheet" href="/videoplayer.css" />
			<Script src="https://vjs.zencdn.net/8.0.4/video.min.js"></Script>
			<div className="video-container" id="video-container" ref={videoContainer}>
				<div className="playback-animation" id="playback-animation" ref={playbackAnimation}>
					<svg className="svg playback-icons">
						<use className="hidden" href="#play-icon"></use>
						<use href="#pause"></use>
					</svg>
				</div>
				<video className="video" id="my-video" preload="metadata" ref={video}
					onLoadedMetadata={() => initVideo()} onTimeUpdate={() => timeUpdate()} onClick={() => clickedVideo()} onProgress={() => updateProgress()}>
					<source src={`/content/${user.id}/${dir}`} type="video/mp4" />
				</video>
				<div id="settings-tab" className="video-controls hidden">
					<div className="form-group">
						<label htmlFor="formControlRange" id="textInput">Playback speed: 1.0x</label>
						<input type="range" className="input-range form-control-range bg-dark" id="formControlRange" value="1" max="2" step="0.50" />
					</div>
				</div>
				<div className="video-controls" id="video-controls">
					<div className="video-progress">
						<div className="progress-bar" id="seek-bar" ref={progressBar}></div>
						<input className="input-range seek" id="seek" ref={seek} value="0" min="0" type="range" step="0.01" onInput={(e) => skipAhead(e)}/>
						<progress className="progress-bar" id="buffer" value="0" max="100" ref={buffer}></progress>
						<div className="seek-tooltip" id="seek-tooltip" ref={seekTooltip} onMouseMove={(e) => updateSeekTooltip(e)}>00:00</div>
					</div>
					<div className="bottom-controls">
						<div className="left-controls">
							<button className="button" data-title="Play (k)" id="play" onClick={() => togglePlay()}>
								<svg className="svg playback-icons">
									<use href="#play-icon"></use>
									<use className="hidden" href="#pause"></use>
								</svg>
							</button>
							<div className="volume-controls" id="volume-controls">
								<button className="button volume-button" data-title="Mute (m)" id="volume-button" onClick={() => toggleMute()}>
									<svg className="svg">
										<use className="hidden" href="#volume-mute"></use>
										<use className="hidden" href="#volume-low"></use>
										<use href="#volume-high"></use>
									</svg>
								</button>
								<input className="input-range volume" id="volume" value="1" data-mute="0.5" type="range" max="1" min="0" step="0.05" ref={volume}/>
							</div>
							<div className="time">
								<time id="time-elapsed" ref={timeElapsed}>00:00</time>
								<span> / </span>
								<time id="duration" ref={duration}>00:00</time>
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
							<button data-title="Full screen (f)" className="fullscreen-button" id="fullscreen-button" onClick={() => toggleFullScreen()}>
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
