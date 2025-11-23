import { BaseSyntheticEvent, useState } from 'react';
import { FileModalProps } from '@/types/Components/Modals';
import axios from 'axios';
import { useFolderRefetch } from '../../Hooks/FileManager';
import { File } from '@prisma/client';
import { Modal } from 'react-bootstrap';

type FolderNode = {
	name: string;
	id?: string;
	children?: Record<string, FolderNode>;
};

function buildFolderTree(dirs: File[]): FolderNode {
	const root: FolderNode = { name: '', children: {} };

	dirs.forEach((dir) => {
		const parts = dir.path.split('/').filter(Boolean);
		let current = root;
		for (let i = 0; i < parts.length; i++) {
			const part = parts[i];
			current.children ??= {};
			if (!current.children[part]) {
				current.children[part] = { name: part, children: {} };
			}
			if (i === parts.length - 1) {
				current.children[part].id = dir.id;
			}
			current = current.children[part];
		}
	});

	return root;
}

export default function UpdateLocationModal({ file, closeContextMenu, show, onClose }: FileModalProps) {
	const [dirs, setDirs] = useState<File[]>([]);
	const [action, setAction] = useState<'copy' | 'move' | ''>('');
	const [selectedDestination, setSelectedDestination] = useState('');
	const [errorMsg, setErrorMsg] = useState('');
	const [currentPath, setCurrentPath] = useState<string[]>([]);
	const refreshFolder = useFolderRefetch();

	const handleActionSubmit = async (e: BaseSyntheticEvent) => {
		e.preventDefault();
		try {
			await axios.post(`/api/files/${action}`, {
				newDirId: selectedDestination,
				fileId: file.id,
			});
			refreshFolder();
		} catch (err) {
			if (axios.isAxiosError(err)) return setErrorMsg(err.response?.data.error);
			console.log(err);
		}
		if (closeContextMenu) closeContextMenu();
	};

	function onShow() {
		axios.get('/api/files/directories').then(({ data }) => {
			setDirs(data.dirs.filter((d: File) => !d.path.startsWith(file.path)));
			setCurrentPath([]);
		});
	}

	const folderTree = buildFolderTree(dirs);
	let node = folderTree;
	for (const part of currentPath) {
		node = node.children?.[part] ?? { name: '', children: {} };
	}

	const folderEntries = node.children ? Object.entries(node.children) : [];

	return (
		<Modal show={show} onHide={onClose} onShow={onShow} centered>
			<Modal.Header closeButton>
				<Modal.Title>
          Move or Copy {file.name}
				</Modal.Title>
			</Modal.Header>
			<form onSubmit={handleActionSubmit}>
				<Modal.Body>
					<p>
						Select a destination folder.
						{currentPath.length > 0 && (
							<span className="d-block text-muted small mt-1">
								Current location: <strong>{['Home', ...currentPath].join(' > ')}</strong>
							</span>
						)}
						{selectedDestination && (
							<span className="d-block text-muted small">
								Selected path: <strong>{dirs.find(d => d.id === selectedDestination)?.path ?? 'Unknown'}</strong>
							</span>
						)}
					</p>

					{currentPath.length > 0 && (
						<button type="button" className="btn btn-sm btn-outline-secondary mb-2" onClick={() => setCurrentPath((prev) => prev.slice(0, -1))}>
							← Back
						</button>
					)}

					<ul className="list-group mb-2">
						{folderEntries.map(([name, child]) => (
							<li key={name} className="list-group-item d-flex justify-content-between align-items-center">
								<div className="form-check">
									<input className="form-check-input"	type="radio"	name="destination"	id={child.id ?? name}	onChange={() => setSelectedDestination(child.id ?? '')}	disabled={file.parentId === child.id || !child.id} />
									<label className="form-check-label" htmlFor={child.id ?? name}>
										{name}
									</label>
								</div>
								{child.children && Object.keys(child.children).length > 0 && (
									<button type="button" className="btn btn-sm btn-outline-primary" onClick={() => setCurrentPath((prev) => [...prev, name])}>
										Browse
									</button>
								)}
							</li>
						))}
					</ul>
					{errorMsg && <div className="invalid-feedback" style={{ color: 'red', display: 'block' }}>{errorMsg}</div>}
					<input type="hidden" value={action} name="action" />
				</Modal.Body>
			</form>
			<Modal.Footer>
				<button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
				<button type="submit" className="btn btn-primary" onClick={() => setAction('move')}>Move</button>
				<button type="submit" className="btn btn-primary" onClick={() => setAction('copy')}>Copy</button>
			</Modal.Footer>
		</Modal>
	);
}
