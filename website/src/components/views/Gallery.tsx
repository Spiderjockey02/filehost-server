import { useState, useEffect, useMemo, useRef } from 'react';
import type { GalleryProps } from '@/types/Components/Views';
import type { File } from '@/types/generated/browser';
import type { ImageLoaderProps } from 'next/image';
import Image from 'next/image';
import Link from 'next/link';

export default function Gallery({ files }: GalleryProps) {
	const myLoader = ({ src }: ImageLoaderProps) => `/thumbnail/${files[0].userId}${encodeURI(src)}`;
	const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

	// Group by images by month-year and then day-month-year
	const groupedFiles = useMemo(() => {
		const groups: Record<string, Record<string, File[]>> = {};
		for (const file of files) {
			const date = new Date(file.metadata?.originalCreatedAt ?? file.createdAt);

			const monthKey = date.toLocaleDateString('en-GB', {
				month: 'long',
				year: 'numeric',
			});

			const dayKey = date.toLocaleDateString('en-GB', {
				day: '2-digit',
				month: 'long',
				year: 'numeric',
			});

			if (!groups[monthKey]) groups[monthKey] = {};
			if (!groups[monthKey][dayKey]) groups[monthKey][dayKey] = [];
			groups[monthKey][dayKey].push(file);
		}

		return groups;
	}, [files]);

	// Create list of months and which is in active view
	const monthNames = useMemo(() => Object.keys(groupedFiles), [groupedFiles]);
	const [activeMonth, setActiveMonth] = useState<string | null>(monthNames[0]);

	// Detect which month is currently being viewed
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
	const scrollToMonth = (month: string) => {
		const el = sectionRefs.current[month];
		const container = document.getElementById('bodyForScroll');
		if (!el || !container) return;

		// Calculate where it needs to scroll to
		const elTop = el.offsetTop;
		const containerTop = container.offsetTop;
		const targetScroll = elTop - containerTop;
		container.scrollTo({ top: targetScroll, behavior: 'smooth' });
	};

	return (
		<div className="position-relative">
			{Object.entries(groupedFiles).map(([monthYear, days]) => (
				<section key={monthYear} ref={(el) => {sectionRefs.current[monthYear] = el;}} className="mb-3">
					<h5 className="fw-bold text-muted mb-2 py-2">{monthYear}</h5>
					{Object.entries(days).map(([day, f]) => (
						<>
							<h6 className="fw-bold text-muted my-2">{day}</h6>
							<div className="d-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(180px, max-content))', gap: '5px', justifyContent: 'start' }}>
								{f.map(lf => {
									return (
										<div key={lf.id} className="text-center rounded position-relative file-container" data-observe data-id={lf.id}>
											<Link href={`/files${lf.path}`} className="text-decoration-none">
												<Image className="center img-fluid" loader={myLoader} src={lf.path} alt={lf.name}
													width={200} height={260} style={{ borderRadius: '8px' }} loading='lazy'
												/>
											</Link>
											<div className="file-name-overlay text-truncate">{lf.name}</div>
										</div>
									);
								})}
							</div>
						</>
					))}
				</section>
			))}
			<div className="position-fixed end-0 me-3 d-flex flex-column align-items-end bottom-0">
				<div className="d-flex flex-column justify-content-between align-items-end w-100" style={{ height: 'calc(100vh - 75px)', paddingBottom: '8px' }}>
					{monthNames.map((month) => (
						<button key={month} onClick={() => scrollToMonth(month)} className={`btn btn-sm ${
							activeMonth === month ? 'btn-primary' : 'btn-outline-secondary'
						}`} style={{ whiteSpace: 'nowrap' }}>
							{month}
						</button>
					))}
				</div>
			</div>
		</div>
	);
}