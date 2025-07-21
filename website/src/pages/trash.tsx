import { faRotateLeft, faTrash } from '@fortawesome/free-solid-svg-icons';
import { TrashContextMenu, FileDetailCell, Table } from '@/components';
import { useEffect, useState, useCallback, MouseEvent } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { GetServerSidePropsContext } from 'next';
import { authClient } from '@/auth/client';
import FileLayout from '@/layouts/file';
import axios from 'axios';
import { File } from '@prisma/client';
import { User } from 'better-auth';
import { DeletedFile } from '@/types/database';
import { format } from '@/utils/functions';

const initalContextMenu = {
	show: false,
	x: 0,
	y: 0,
	selected: [] as File[],
};

export default function Trash() {
	const { data: session } = authClient.useSession();
	const [files, setFiles] = useState<DeletedFile[]>([]);
	const [selected, setSelected] = useState<File[]>([]);
	const [contextMenu, setContextMenu] = useState(initalContextMenu);

	function openContextMenu(e: MouseEvent<HTMLTableRowElement>, selectedFile: File) {
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
	const handleCheckboxToggle = (filePath: File) => {
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
		<FileLayout user={session.user as User} activeTab='bin'>
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
							<FileDetailCell file={file} disableClick={true} />
							<td>{format(new Date(file.deletedAt))}</td>
						</tr>
					))}
				</Table.Body>
			</Table>
		</FileLayout>
	);
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
	const res = await fetch(`${process.env.BETTER_AUTH_URL}/api/auth/get-session`, {
		headers: {
			cookie: context.req.headers.cookie || '',
		},
	});

	const data = await res.json();
	if (data == null) {
		return {
			redirect: {
				destination: '/login',
				permanent: false,
			},
		};
	} else {
		// Get the path from the URL
		const path = [context.params?.files].flat();
		return { props: { path: path.join('/') } };
	}
}