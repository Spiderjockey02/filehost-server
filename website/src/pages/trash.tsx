import { faRotateLeft, faTrash } from '@fortawesome/free-solid-svg-icons';
import { TrashContextMenu, FileDetailCell, Table } from '@/components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useToast } from '@/components/Hooks/ToastManager';
import { format, queryOptions } from '@/utils/functions';
import { useState, MouseEvent, useEffect } from 'react';
import type { File } from '@/types/generated/browser';
import type { GetServerSidePropsContext } from 'next';
import type { DeletedFile } from '@/types/database';
import { useQuery } from '@tanstack/react-query';
import { authClient } from '@/auth/client';
import FileLayout from '@/layouts/file';
import type { User } from 'better-auth';
import axios from 'axios';

const initalContextMenu = {
	show: false,
	x: 0,
	y: 0,
	selected: [] as File[],
};

export default function Trash() {
	const { data: session } = authClient.useSession();
	const [selected, setSelected] = useState<File[]>([]);
	const [contextMenu, setContextMenu] = useState(initalContextMenu);
	const { showToast } = useToast();

	const { data, isLoading, error, refetch } = useQuery({
		queryKey: ['trash'],
		queryFn: async ({ signal }) => {
			const res = await fetch('/api/session/trash', { signal });
			if (!res.ok) throw new Error(`Failed to fetch user's trashed files: ${res.statusText}`);

			const d = await res.json();
			const files = d.files as DeletedFile[];
			const parentIds = new Set(files.map(f => f.id));
			const filtered = files.filter(f => !parentIds.has(f.parentId ?? ''));
			return { files: filtered };
		},
		...queryOptions,
	});

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

	// Empty Trash Bin
	const handleEmptyBin = async () => {
		try {
			await axios.delete('/api/session/trash/empty');
			await refetch();
		} catch (err) {
			if (axios.isAxiosError(err)) {
				const message = err.response?.data?.error || err.message || 'An unexpected error occurred while empting the bin.';
				showToast('error', message);
			} else {
				showToast('error', 'Unexpected error occurred');
			}
		}
	};

	// Restore selected files
	const handleRestore = async () => {
		try {
			await axios.put('/api/session/trash/restore', { paths: selected.map(s => s.path) });
			setSelected([]);
			await refetch();
		} catch (err) {
			if (axios.isAxiosError(err)) {
				const message = err.response?.data?.error || err.message || 'An unexpected error occurred while restoring files.';
				showToast('error', message);
			} else {
				showToast('error', 'Unexpected error occurred');
			}
		}
	};

	// Toggle all checkboxes
	function handleSelectAllToggle() {
		if (selected.length == 0) {
			setSelected(data?.files ?? []);
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
		if (error) showToast('error', error.message);
	}, [error]);

	if (session == null) return null;
	return (
		<FileLayout user={session.user as User} activeTab='bin' tabName='Trash'>
			<div className="d-flex justify-content-between align-items-center mb-3">
				<nav aria-label="breadcrumb">
					<ol className="breadcrumb bg-white mb-0">
						<li className="breadcrumb-item fw-bold">Trash</li>
					</ol>
				</nav>
			</div>
			<div className="mb-3">
				<button className="btn btn-outline-danger me-2" onClick={handleEmptyBin} disabled={data?.files.length === 0}>
					<FontAwesomeIcon icon={faTrash} /> Empty Bin
				</button>
				<button className="btn btn-outline-secondary" onClick={handleRestore} disabled={selected.length === 0}>
					<FontAwesomeIcon icon={faRotateLeft} /> Restore
				</button>
			</div>
			{contextMenu.show && <TrashContextMenu x={contextMenu.x} y={contextMenu.y} closeContextMenu={closeContextMenu} selected={contextMenu.selected} />}
			{isLoading || data == null ?
				<p>Loading</p> :
				<Table>
					<Table.HeaderRow>
						<Table.Header className='text-center' style={{ width: '5%' }}>
							<input className="form-check-input"	type="checkbox"	onChange={handleSelectAllToggle} checked={selected.length === data.files.length && data.files.length > 0}	aria-label="Select all files" />
						</Table.Header>
						<Table.Header>
							Name
						</Table.Header>
						<Table.Header>
							Deleting
						</Table.Header>
					</Table.HeaderRow>
					<Table.Body>
						{data.files.sort((a, b) => new Date(b.deletedAt).getTime() - new Date(a.deletedAt).getTime()).map(file => (
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
			}
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
		return { props: { } };
	}
}