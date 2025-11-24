import { useState, useEffect, useMemo, useRef } from 'react';
import type { GalleryProps } from '@/types/Components/Views';
import type { ImageLoaderProps } from 'next/image';
import { File } from '@/types/generated/browser';
import Image from 'next/image';
import Link from 'next/link';

export default function Gallery({ files }: GalleryProps) {
	const myLoader = ({ src }: ImageLoaderProps) => `/thumbnail/${files[0].userId}${encodeURI(src)}`;
	const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
	const [visible, setVisible] = useState<Record<string, boolean>>({});
	const observerRefs = useRef<Record<string, IntersectionObserver>>({});
	const [monthHeights, setMonthHeights] = useState<Record<string, number>>({});

	// Group by month-year
	const groupedFiles = useMemo(() => {
		const groups: Record<string, File[]> = {};
		for (const file of files) {
			const date = new Date(file.createdAt);
			const dayKey = date.toLocaleDateString('en-GB', {
				day: '2-digit',
				month: 'long',
				year: 'numeric',
			});

			if (!groups[dayKey]) groups[dayKey] = [];
			groups[dayKey].push(file);
		}
		return groups;
	}, [files]);

	const monthNames = useMemo(() => Object.keys(groupedFiles), [groupedFiles]);
	const [activeMonth, setActiveMonth] = useState<string | null>(monthNames[0]);

	// Only load the thumbnail when in view
	useEffect(() => {
		Object.values(observerRefs.current).forEach((obs) => obs.disconnect());
		observerRefs.current = {};

		const observer = new IntersectionObserver((entries) => {
			for (const entry of entries) {
				if (entry.isIntersecting) {
					const id = entry.target.getAttribute('data-id');
					if (id) {
						setVisible((prev) => ({ ...prev, [id]: true }));
						observer.unobserve(entry.target);
					}
				}
			}
		}, { rootMargin: '260px' });
		document.querySelectorAll('[data-observe]').forEach((el) => observer.observe(el));
	}, [files]);

	// Measure how tall each month section is in pixels
	useEffect(() => {
		const updateHeights = () => {
			const heights: Record<string, number> = {};
			for (const month of monthNames) {
				const el = sectionRefs.current[month];
				if (el) heights[month] = el.offsetHeight;
			}
			setMonthHeights(heights);
		};

		updateHeights();
		window.addEventListener('resize', updateHeights);
		return () => window.removeEventListener('resize', updateHeights);
	}, [monthNames]);

	// Active month detection
	useEffect(() => {
		const handleScroll = () => {
			let current: string | null = null;
			for (const month of monthNames) {
				const el = sectionRefs.current[month];
				if (el) {
					const rect = el.getBoundingClientRect();
					if (rect.top <= 120 && rect.bottom >= 120) {
						current = month;
						break;
					}
				}
			}
			if (current && current !== activeMonth) setActiveMonth(current);
		};
		const container = document.getElementById('bodyForScroll');
		if (container == null) return;

		container.addEventListener('scroll', handleScroll, { passive: true });
		return () => container.removeEventListener('scroll', handleScroll);
	}, [monthNames, activeMonth]);

	// Scroll to month when button is clicked
	const scrollToMonth = (month: string, attempt = 0) => {
		const el = sectionRefs.current[month];
		const container = document.getElementById('bodyForScroll');
		if (!el || !container) return;

		// Calculate where it needs to scroll to
		const elTop = el.offsetTop;
		const containerTop = container.offsetTop;
		const targetScroll = elTop - containerTop;

		// A bit buggy with lazy load so re-run function while it loads, up to 3 times
		container.scrollTo({ top: targetScroll, behavior: 'smooth' });
		if (attempt < 3) setTimeout(() => scrollToMonth(month, attempt + 1), 250);
	};

	// Calculate proportional positions based on section height
	const totalHeight = Object.values(monthHeights).reduce((a, b) => a + b, 0);
	const monthPositions = useMemo(() => {
		const positions: Record<string, number> = {};
		let offset = 0;
		for (const month of monthNames) {
			const h = monthHeights[month] ?? 0;
			positions[month] = offset;
			offset += (h / totalHeight) * 100;
		}
		return positions;
	}, [monthHeights, monthNames, totalHeight]);

	return (
		<div className="position-relative">
			{Object.entries(groupedFiles).map(([monthYear, group]) => (
				<section key={monthYear} ref={(el) => {sectionRefs.current[monthYear] = el;}} className="mb-5">
					<h5 className="fw-bold text-muted mb-3 sticky-top py-2">{monthYear}</h5>
					<div className="d-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '5px' }}>
						{group.map((file) => {
							const show = visible[file.id];
							return (
								<div key={file.id} className="text-center rounded position-relative file-container" data-observe data-id={file.id}>
									<Link href={`/files${file.path}`} className="text-decoration-none">
										{show ? (
											<Image className="center img-fluid" loader={myLoader} src={file.path} alt={file.name}
												width={200} height={260} style={{ borderRadius: '8px' }}
											/>
										) : (
											<div style={{ width: 200, height: 260, borderRadius: '8px', backgroundColor: '#f0f0f0' }} />
										)}
									</Link>
									<div className="file-name-overlay text-truncate">{file.name}</div>
								</div>
							);
						})}
					</div>
				</section>
			))}
			<div className="position-fixed end-0 top-0 bottom-0 me-3 d-flex flex-column align-items-end" style={{ zIndex: 10, width: '130px', justifyContent: 'flex-start' }}>
				<div className="position-relative w-100" style={{ height: '100%', top: '75px' }}>
					{monthNames.map((month, index) => {
						const pos = monthPositions[month] ?? 0;
						return (
							<button key={month} onClick={() => scrollToMonth(month)} className={`btn btn-sm position-absolute ${
								activeMonth === month ? 'btn-primary' : 'btn-outline-secondary'
							}`}
							style={{ top: index == 0 ? `${pos}%` : `calc(${pos}% - 72px)`, right: 0 }}>
								{month}
							</button>
						);
					})}
				</div>
			</div>
		</div>
	);
}