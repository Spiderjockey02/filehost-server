import { BaseSyntheticEvent, useEffect, useRef, useState } from 'react';
import { FileModalProps } from '@/types/Components/Modals';
import { fileItem } from '@/types';
import axios from 'axios';
import { useSetFolder } from '../Hooks/FileManager';

export default function UpdateLocationModal({ file, closeContextMenu }: FileModalProps) {
	const elementRef = useRef(null);
	const [dirs, setDirs] = useState<fileItem[]>([]);
	const [action, setAction] = useState<'copy' | 'move' | ''>('');
	const [selectedDestination, setSelectedDestination] = useState('');
	const [errorMsg, setErrorMsg] = useState('');
	const setFolder = useSetFolder();

	function closeModal(id: string) {
		document.getElementById(id)?.classList.remove('show');
		document.getElementById(id)?.setAttribute('aria-hidden', 'true');
		document.getElementById(id)?.setAttribute('style', 'display: none');
		document.body.removeChild(document.getElementsByClassName('modal-backdrop')[0] as Node);
		if (closeContextMenu) closeContextMenu();
	}

	const handleActionSubmit = async (e: BaseSyntheticEvent) => {
		e.preventDefault();

		try {
			await axios.post(`/api/files/${action}`, {
				newDirId: selectedDestination,
				fileId: file.id,
			});
			const { data } = await axios.get(`/api/${window.location.pathname}`);
			setFolder(data.file);
		} catch (err) {
			if (axios.isAxiosError(err)) return setErrorMsg(err.response?.data.error);
			console.log(err);
		}
		closeModal(`change_${file.id}`);
	};

	useEffect(() => {
		const targetElement = elementRef.current;

		if (!targetElement) return;

		const observer = new MutationObserver((mutations) => {
			mutations.forEach((mutation) => {
				if ((mutation.target as HTMLDivElement).className.includes('show')) {
					axios.get('/api/files/directories').then(({ data }) => {
						setDirs(data.dirs);
					});
				}
			});
		});

		// Start observing the target element for class changes
		observer.observe(targetElement, { attributes: true, attributeFilter: ['class'] });

		// Cleanup the observer on component unmount
		return () => observer.disconnect();
	}, []);


	return (
		<div className="modal fade" ref={elementRef} id={`change_${file.id}`} role="dialog" aria-labelledby="exampleModalCenterTitle" aria-hidden="true">
			<div className="modal-dialog modal-dialog-centered" role="document">
				<div className="modal-content">
					<div className="modal-header">
						<h5 className="modal-title text-truncate" id="exampleModalLongTitle">Move or Copy {file.name}</h5>
						<button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
					</div>
					<form method='post' onSubmit={handleActionSubmit}>
						<div className="modal-body w-100">
							<p>Select a destination folder.</p>
							{dirs.filter(c => !c.path.startsWith(file.path)).map(dir => (
								<div className="form-check" key={dir.id}>
									<input className="form-check-input" type="radio" name='destination' id={dir.id} onChange={() => setSelectedDestination(dir.id)} disabled={file.parentId == dir.id} />
									<label className="form-check-label" htmlFor={dir.id}>
										{dir.path}
									</label>
								</div>
							))}
							{errorMsg && <div className="invalid-feedback" style={{ color: 'red', display: 'block' }}>{errorMsg}</div>}
							<input type="hidden" value={action} name="action" />
						</div>
						<div className="modal-footer">
							<button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
							<button type="submit" className="btn btn-primary" onClick={() => setAction('move')}>Move</button>
							<button type="submit" className="btn btn-primary" onClick={() => setAction('copy')}>Copy</button>
						</div>
					</form>
				</div>
			</div>
		</div>
	);
}