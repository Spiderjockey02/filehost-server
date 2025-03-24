import { faRotateLeft, faTrash } from '@fortawesome/free-solid-svg-icons';
import { useEffect, useState, useCallback, MouseEvent } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { TrashContextMenu, FileDetailCell } from '@/components';
import en from 'javascript-time-ago/locale/en';
import Table from '@/components/UI/Table';
import TimeAgo from 'javascript-time-ago';
import FileLayout from '@/layouts/file';
import { fileItem } from '@/types';
import axios from 'axios';
import { useTypedSession } from '@/auth-client';
TimeAgo.addDefaultLocale(en);
const timeAgo = new TimeAgo('en-US');

const initalContextMenu = {
	show: false,
	x: 0,
	y: 0,
	selected: [] as fileItem[],
};

export default function Trash() {
	const { data: session } = useTypedSession();
	const [files, setFiles] = useState<fileItem[]>([]);
	const [selected, setSelected] = useState<fileItem[]>([]);
	const [contextMenu, setContextMenu] = useState(initalContextMenu);

	function openContextMenu(e: MouseEvent<HTMLTableRowElement>, selectedFile: fileItem) {
		e.preventDefault();
		const { pageX, pageY } = e;

		const menuWidth = 170;
		const menuHeight = 270;
		const windowWidth = window.innerWidth;
		const windowHeight = window.innerHeight;

		let posX = pageX;
		let posY = pageY;

		// Adjust position if the menu would overflow the viewport
		if (posX + menuWidth > windowWidth) posX = windowWidth - menuWidth;
		if (posY + menuHeight > windowHeight) posY = windowHeight - menuHeight;

		// Update this to support multi-selection
		if (selected.length > 0) {
			setContextMenu({ show: true, x: posX, y: posY, selected: selected });
		} else {
			setContextMenu({ show: true, x: posX, y: posY, selected: [selectedFile] });
		}
	}

	const closeContextMenu = () => setContextMenu(initalContextMenu);

	// Fetch files from API
	const fetchFiles = useCallback(async () => {
		try {
			const { data } = await axios.get('/api/trash');
			setFiles(data.files);
		} catch (err) {
			console.error('Error fetching files:', err);
		}
	}, []);

	// Empty Trash Bin
	const handleEmptyBin = async () => {
		try {
			await axios.delete('/api/trash/empty');
			setFiles([]);
		} catch (err) {
			console.error('Error emptying bin:', err);
		}
	};

	// Restore selected files
	const handleRestore = async () => {
		try {
			await axios.put('/api/trash/restore', { paths: selected.map(s => s.path) });
			setSelected([]);
			await fetchFiles();
		} catch (err) {
			console.error('Error restoring files:', err);
		}
	};

	// Toggle all checkboxes
	function handleSelectAllToggle() {
		if (selected.length == 0) {
			setSelected(files);
		} else {
			setSelected([]);
		}
	}

	// Toggle individual checkbox selection
	const handleCheckboxToggle = (filePath: fileItem) => {
		setSelected(prevSelected =>
			prevSelected.includes(filePath)
				? prevSelected.filter(f => f !== filePath)
				: [...prevSelected, filePath],
		);
	};

	useEffect(() => {
		fetchFiles();
	}, [fetchFiles]);

	if (session == null) return null;
	return (
		<FileLayout user={session.user}>
			<div className="d-flex justify-content-between align-items-center mb-3">
				<nav aria-label="breadcrumb">
					<ol className="breadcrumb bg-white mb-0">
						<li className="breadcrumb-item"><b>Trash</b></li>
					</ol>
				</nav>
			</div>
			<div className="mb-3">
				<button className="btn btn-outline-danger me-2" onClick={handleEmptyBin}>
					<FontAwesomeIcon icon={faTrash} /> Empty Bin
				</button>
				<button className="btn btn-outline-secondary" onClick={handleRestore} disabled={selected.length === 0}>
					<FontAwesomeIcon icon={faRotateLeft} /> Restore
				</button>
			</div>
			{contextMenu.show && <TrashContextMenu x={contextMenu.x} y={contextMenu.y} closeContextMenu={closeContextMenu} selected={contextMenu.selected} />}
			<Table>
				<Table.HeaderRow>
					<Table.Header className='text-center' style={{ width: '5%' }}>
						<input className="form-check-input"	type="checkbox"	onChange={handleSelectAllToggle} checked={selected.length === files.length && files.length > 0}	aria-label="Select all files" />
					</Table.Header>
					<Table.Header>
						Name
					</Table.Header>
					<Table.Header>
						Deleted on
					</Table.Header>
				</Table.HeaderRow>
				<Table.Body>
					{files.sort((a, b) => new Date(b.deletedAt).getTime() - new Date(a.deletedAt).getTime()).map(file => (
						<tr key={file.id} onContextMenu={(e) => openContextMenu(e, file)}>
							<td className="text-center">
								<input className="form-check-input" type="checkbox" checked={selected.includes(file)} onChange={() => handleCheckboxToggle(file)} aria-label={`Select file ${file.path}`} />
							</td>
							<FileDetailCell file={file} />
							<td>{timeAgo.format(new Date(file.deletedAt))}</td>
						</tr>
					))}
				</Table.Body>
			</Table>
		</FileLayout>
	);
}
