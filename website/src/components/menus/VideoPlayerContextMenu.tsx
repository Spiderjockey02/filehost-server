import type { VideoPlayerContextMenuProps } from '@/types/Components/Menu';
import styles from '@/styles/VideoPlayer.module.css';
import { useState } from 'react';

export default function VideoPlayerContextMenu({ contextMenu, videoRef, menuRef, currentTime, setContextMenu, setShowStats }: VideoPlayerContextMenuProps) {
	const [isLooping, setIsLooping] = useState(videoRef.current?.loop ?? false);

	const toggleLoop = () => {
		const video = videoRef.current;
		if (!video) return;
		video.loop = !video.loop;

		setIsLooping(video.loop);
		setContextMenu(null);
	};

	const copyVideoUrl = () => {
		const url = window.location.href;
		navigator.clipboard?.writeText(url);
		setContextMenu(null);
	};

	const copyVideoUrlAtTime = () => {
		const t = Math.floor(currentTime);
		const url = `${window.location.href}?t=${t}`;
		navigator.clipboard?.writeText(url);
		setContextMenu(null);
	};

	const toggleStats = () => {
		setShowStats((prev) => !prev);
		setContextMenu(null);
	};

	return (
		<div className={styles.contextMenu} style={{ left: contextMenu.x, top: contextMenu.y }} ref={menuRef}>
			<div className={styles.contextItem} onClick={toggleLoop}>
				{isLooping ? 'Loop (On)' : 'Loop (Off)'}
			</div>
			<div className={styles.contextItem} onClick={copyVideoUrl}>
      	Copy video URL
			</div>
			<div className={styles.contextItem} onClick={copyVideoUrlAtTime}>
      	Copy video URL at current time
			</div>
			<div className={styles.contextItem} onClick={toggleStats}>
      	Stats for nerds
			</div>
		</div>
	);
}