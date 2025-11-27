import { faPlay, faPause, faVolumeHigh, faExpand, faCompress, faSquare, faVolumeXmark, faVolumeOff, faVolumeLow, faBackward, faForward } from '@fortawesome/free-solid-svg-icons';
import type { HUDIndicator, VideoPlayerProps } from '@/types/Components/Views';
import VideoPlayerContextMenu from '../Menus/VideoPlayerContextMenu';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useEffect, useRef, useState } from 'react';
import styles from '@/styles/VideoPlayer.module.css';
import { formatTime } from '@/utils/functions';


const autoHideTimeout = 2500;
export default function VideoPlayer({ videoPath, thumbnailPath }: VideoPlayerProps) {
	const videoRef = useRef<HTMLVideoElement | null>(null);
	const containerRef = useRef<HTMLDivElement | null>(null);

	// Handle video state
	const [isPlaying, setIsPlaying] = useState(false);
	const [currentTime, setCurrentTime] = useState(0);
	const [duration, setDuration] = useState<number>(0);
	const [volume, setVolume] = useState<number>(1);
	const [muted, setMuted] = useState(false);
	const [bufferedPercent, setBufferedPercent] = useState(0);
	const [showControls, setShowControls] = useState(true);
	const [isFullscreen, setIsFullscreen] = useState(false);
	const [playbackRate, setPlaybackRate] = useState<number>(1);
	const [hoverTime, setHoverTime] = useState<string | null>(null);
	const [isVolumeHover, setIsVolumeHover] = useState(false);
	const tooltipXRef = useRef(0);

	const [indicator, setIndicator] = useState<HUDIndicator>(null);
	const hideTimeoutRef = useRef<number | null>(null);

	// Handle context menu and stats
	const [contextMenu, setContextMenu] = useState<{ x: number; y: number; visible: boolean;} | null>(null);
	const menuRef = useRef<HTMLDivElement | null>(null);
	const [showStats, setShowStats] = useState(false);
	const [nerdStats, setNerdStats] = useState({
		resolution: '0x0',
		dropped: 0,
		total: 0,
		bufferAhead: '0',
		bitrate: 0,
	});

	useEffect(() => {
		const video = videoRef.current;
		if (!video || !showStats) return;

		// @ts-expect-error typescript stuff
		let lastBytes = video.webkitVideoDecodedByteCount || 0;
		let lastTime = performance.now();

		const interval = setInterval(() => {
			const quality = video.getVideoPlaybackQuality?.();

			// Resolution
			const resolution = `${video.videoWidth}x${video.videoHeight}`;

			// Buffer ahead
			let bufferAhead = 0;
			if (video.buffered.length > 0) bufferAhead = video.buffered.end(video.buffered.length - 1) - video.currentTime;

			const dropped = quality?.droppedVideoFrames ?? 0;
			const total = quality?.totalVideoFrames ?? 0;

			const now = performance.now();
			// @ts-expect-error typescript stuff
			const currentBytes = video.webkitVideoDecodedByteCount || 0;

			const bytesDelta = currentBytes - lastBytes;
			const timeDelta = (now - lastTime) / 1000;

			let bitrate = 0;
			if (timeDelta > 0) bitrate = Math.round((bytesDelta * 8) / 1000 / timeDelta);

			// Prepare next iteration
			lastBytes = currentBytes;
			lastTime = now;

			// Update nerd stats
			setNerdStats({
				resolution,
				dropped,
				total,
				bufferAhead: Math.max(0, bufferAhead).toFixed(2),
				bitrate,
			});
		}, 500);

		return () => clearInterval(interval);
	}, [showStats]);

	// Show controls on mouse move / focus then auto-hide
	function resetHideTimer() {
		setShowControls(true);

		if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
		hideTimeoutRef.current = window.setTimeout(() => setShowControls(false), autoHideTimeout);
	}

	useEffect(() => {
		let v = videoRef.current;
		if (!v) return;

		function onLoadedMeta() {
			v = videoRef.current;
			if (!v) return;
			setDuration(v.duration || 0);
			setCurrentTime(v.currentTime || 0);
			setVolume(v.volume);
			setMuted(v.muted);
		}

		function onTimeUpdate() {
			v = videoRef.current;
			if (!v) return;
			setCurrentTime(v.currentTime);
			// buffered
			if (v.buffered && v.buffered.length > 0) {
				const end = v.buffered.end(v.buffered.length - 1);
				setBufferedPercent((end / (v.duration || 1)) * 100);
			}
		}

		function handleClick(e: MouseEvent) {
			if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
				setContextMenu(null);
			}
		}

		v.addEventListener('loadedmetadata', onLoadedMeta);
		v.addEventListener('timeupdate', onTimeUpdate);
		v.addEventListener('progress', onTimeUpdate);
		v.addEventListener('play', () => setIsPlaying(true));
		v.addEventListener('pause', () => setIsPlaying(false));
		document.addEventListener('fullscreenchange', () => setIsFullscreen(document.fullscreenElement != null));
		window.addEventListener('click', handleClick);

		return () => {
			v = videoRef.current;
			if (!v) return;

			window.removeEventListener('click', handleClick);
			document.removeEventListener('fullscreenchange', () => setIsFullscreen(document.fullscreenElement != null));
			v.removeEventListener('loadedmetadata', onLoadedMeta);
			v.removeEventListener('timeupdate', onTimeUpdate);
			v.removeEventListener('progress', onTimeUpdate);
			v.removeEventListener('play', () => setIsPlaying(true));
			v.removeEventListener('pause', () => setIsPlaying(false));
			if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
		};
	}, []);

	function flashFeedback(type: HUDIndicator) {
		setIndicator(type);
		setTimeout(() => setIndicator(null), 700);
	}

	// keyboard shortcuts
	useEffect(() => {
		function onKey(e: KeyboardEvent) {
			e.preventDefault();
			if (!containerRef.current) return;
			const active = document.activeElement;
			if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')) return;

			switch (e.code) {
				case 'Space':
				case 'KeyK':
					togglePlay();
					break;
				case 'KeyM':
					toggleMute();
					break;
				case 'KeyF':
					toggleFullscreen();
					break;
				case 'ArrowRight':
					if (currentTime == duration) return;
					seekTo(Math.min(duration, currentTime + 5));
					flashFeedback('seek_forward');
					break;
				case 'ArrowLeft':
					if (currentTime == 0) return;
					seekTo(Math.max(0, currentTime - 5));
					flashFeedback('seek_backward');
					break;
				case 'Period':
					if (playbackRate == 2) return;
					changePlaybackRate(Math.min(2, playbackRate + 0.25));
					flashFeedback('speed');
					break;
				case 'Comma':
					if (playbackRate == 0.25) return;
					changePlaybackRate(Math.max(0.25, playbackRate - 0.25));
					flashFeedback('speed');
					break;
				case 'ArrowUp':
					if (volume == 1) return;
					onVolumeChange(Math.min(1, volume + 0.1));
					flashFeedback('volume');
					break;
				case 'ArrowDown':
					if (volume == 0) return;
					onVolumeChange(Math.max(0, volume - 0.1));
					flashFeedback('volume');
					break;
			}
			resetHideTimer();
		}

		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	}, [duration, currentTime, playbackRate, resetHideTimer]);

	async function togglePlay() {
		const v = videoRef.current;
		if (!v) return;
		if (v.paused || v.ended) {
			await v.play().catch(() => null);
			setIsPlaying(true);
		} else {
			v.pause();
			setIsPlaying(false);
		}
	}

	function toggleMute() {
		const v = videoRef.current;
		if (!v) return;
		v.muted = !v.muted;
		setMuted(v.muted);
		setVolume(v.volume);
	}

	function onVolumeChange(newVolume: number) {
		const v = videoRef.current;
		if (!v) return;
		v.volume = newVolume;
		v.muted = (newVolume == 0);
		setVolume(v.volume);
		setMuted(v.muted);
	}

	function seekTo(time: number) {
		const v = videoRef.current;
		if (!v || !isFinite(time)) return;
		v.currentTime = time;
		setCurrentTime(time);
	}

	function toggleFullscreen() {
		const el = containerRef.current;
		if (!el) return;

		if (!document.fullscreenElement) {
			el.requestFullscreen().catch(() => null);
		} else {
			document.exitFullscreen().catch(() => null);
		}
	}

	function changePlaybackRate(rate: number) {
		const v = videoRef.current;
		if (!v) return;
		v.playbackRate = rate;
		setPlaybackRate(rate);
	}

	async function togglePIP() {
		const v = videoRef.current;
		if (!v) return;
		if (document.pictureInPictureElement) {
			await document.exitPictureInPicture().catch(() => null);
		} else if (v.requestPictureInPicture) {
			await v.requestPictureInPicture().catch(() => null);
		}
	}

	// seek hover tooltip time
	function onProgressBarMouseMove(e: React.MouseEvent<HTMLDivElement>) {
		const rect = e.currentTarget.getBoundingClientRect();
		const rawX = e.clientX - rect.left;
		const clampedX = Math.max(0, Math.min(rawX, rect.width));
		tooltipXRef.current = clampedX - 20;

		const pos = clampedX / rect.width;
		const t = pos * (duration || 0);
		setHoverTime(formatTime(t));
	}

	function VolumeIcon() {
		if (muted || volume === 0) return <FontAwesomeIcon icon={faVolumeXmark} />;
		if (volume > 0 && volume <= 0.25) return <FontAwesomeIcon icon={faVolumeOff} />;
		if (volume > 0.25 && volume <= 0.66) return <FontAwesomeIcon icon={faVolumeLow} />;
		return <FontAwesomeIcon icon={faVolumeHigh} />;
	}

	function onContextMenu(e: React.MouseEvent) {
		e.preventDefault();

		const container = containerRef.current;
		if (!container) return;

		const rect = container.getBoundingClientRect();

		const x = e.clientX - rect.left;
		const y = e.clientY - rect.top;

		setContextMenu({ x, y, visible: true });
	}

	function PlaybackRateMenu() {
		const SPEEDS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
		const [open, setOpen] = useState(false);

		useEffect(() => {
			function handleClick(e: MouseEvent) {
				if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
			}
			document.addEventListener('mousedown', handleClick);
			return () => document.removeEventListener('mousedown', handleClick);
		}, []);

		return (
			<div className="position-relative d-flex align-items-center">
				<button className={styles.iconBtn} style={{ padding: '6px 8px' }} onClick={() => setOpen(o => !o)} aria-label="Playback speed">
					{playbackRate}x
				</button>
				{open && (
					<div style={{ position: 'absolute', bottom: '110%', right: 0, background: 'rgba(20,20,20,0.95)', backdropFilter: 'blur(4px)', padding: '6px 0', borderRadius: '8px', minWidth: '80px', boxShadow: '0 2px 10px rgba(0,0,0,0.45)', zIndex: 20 }}>
						{SPEEDS.map(speed => (
							<div key={speed} onClick={() => { changePlaybackRate(speed); setOpen(false);}}
								style={{
									padding: '6px 12px',
									fontSize: '14px',
									color: speed === playbackRate ? '#7dd3fc' : 'white',
									cursor: 'pointer',
									background: speed === playbackRate ? 'rgba(255,255,255,0.08)' : 'transparent',
								}}>
								{speed}x
							</div>
						))}
					</div>
				)}
			</div>
		);
	}

	return (
		<div className="container-fluid">
			<div className={styles.container} ref={containerRef} onMouseMove={resetHideTimer} onMouseEnter={() => setShowControls(true)} onMouseLeave={() => setShowControls(false)} onContextMenu={onContextMenu} tabIndex={0} aria-label="Video player">
				{contextMenu?.visible && <VideoPlayerContextMenu contextMenu={contextMenu} setContextMenu={setContextMenu} videoRef={videoRef} menuRef={menuRef} currentTime={currentTime} setShowStats={setShowStats} /> }
				{showStats && (
					<div className={styles.statsBox}>
						<div>Resolution: {nerdStats.resolution}</div>
						<div>Duration: {formatTime(duration)}</div>
						<div>Current Time: {formatTime(currentTime)}</div>
						<div>Dropped Frames: {nerdStats.dropped} / {nerdStats.total}</div>
						<div>Buffer Ahead: {nerdStats.bufferAhead}s</div>
						<div>Bitrate: {nerdStats.bitrate} kbps</div>
						<div>Volume: {Math.round(volume * 100)}%</div>
						<div>Playback Speed: {playbackRate}x</div>
					</div>
				)}
				<video ref={videoRef} className={styles.video} src={videoPath} preload="metadata" playsInline onClick={togglePlay} poster={thumbnailPath} />
				{!isPlaying && (
					<button className={styles.centerPlay} onClick={() => { togglePlay(); resetHideTimer(); }} aria-label="Play">
						<FontAwesomeIcon icon={faPlay} />
					</button>

				)}
				{indicator === 'seek_forward' && (
					<div className={`${styles.centerPlay} ${styles.feedback}`}>
						<FontAwesomeIcon icon={faForward} />
					</div>
				)}
				{indicator === 'seek_backward' && (
					<div className={`${styles.centerPlay} ${styles.feedback}`}>
						<FontAwesomeIcon icon={faBackward} />
					</div>
				)}
				{indicator === 'volume' && (
					<div className={`${styles.centerPlay} ${styles.feedback}`}>
						<VolumeIcon />
					</div>
				)}
				{indicator === 'speed' && (
					<div className={`${styles.centerPlay} ${styles.feedback}`}>
						<span className={styles.feedbackText}>{playbackRate}x</span>
					</div>
				)}
				<div className={`d-flex  ${styles.controls} ${showControls ? styles.controlsVisible : ''}`} onMouseMove={resetHideTimer}>
					<div className={styles.progressWrap} onMouseMove={onProgressBarMouseMove} onMouseLeave={() => setHoverTime(null)}
						onClick={(e) => {
							const rect = (e.currentTarget).getBoundingClientRect();
							const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
							seekTo(pos * (duration || 0));
						}}
						role="slider" aria-valuemin={0} aria-valuemax={duration} aria-valuenow={currentTime} tabIndex={0}>
						<div className={styles.bufferBar} style={{ width: `${bufferedPercent}%` }} />
						<div className={styles.progressBar} style={{ width: `${(currentTime / (duration || 1)) * 100}%` }} />
						<div className={styles.scrubber} style={{ left: `${(currentTime / (duration || 1)) * 100}%` }} />
						{hoverTime && <div className={styles.tooltip} style={{ left: `${tooltipXRef.current}px` }}>{hoverTime}</div>}
					</div>
					<div className={styles.bottomRow}>
						<div className={styles.left}>
							<button className={styles.iconBtn} onClick={() => { togglePlay(); resetHideTimer(); }} aria-label={isPlaying ? 'Pause' : 'Play'}>
								<FontAwesomeIcon icon={isPlaying ? faPause : faPlay} />
							</button>
							<div className={`${styles.leftControls} ${isVolumeHover ? styles.volumeExpanded : ''}`}>
								<div className={styles.volumeGroup} onMouseEnter={() => setIsVolumeHover(true)} onMouseLeave={() => setIsVolumeHover(false)}>
									<button className={styles.iconBtn} onClick={() => { toggleMute(); resetHideTimer(); }} aria-label={muted ? 'Unmute' : 'Mute'}>
										<VolumeIcon />
									</button>
									<div className={styles.volumeSliderContainer}>
										<input className={styles.volumeSlider} type="range" min={0} max={1} step={0.01} value={volume} onChange={(e) => onVolumeChange(Number(e.target.value))} aria-label="Volume"	/>
									</div>
								</div>
								<div className={styles.timestamp}>
									{formatTime(currentTime)} / {formatTime(duration)}
								</div>
							</div>
						</div>
						<div className={styles.right}>
							<PlaybackRateMenu />
							<button className={styles.iconBtn} onClick={() => { togglePIP(); resetHideTimer(); }} aria-label="Picture in picture">
								<FontAwesomeIcon icon={faSquare} />
							</button>
							<button className={styles.iconBtn} onClick={() => { toggleFullscreen(); resetHideTimer(); }} aria-label="Fullscreen">
								<FontAwesomeIcon icon={isFullscreen ? faCompress : faExpand} />
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}