import { faSort, faSortDown, faSortUp } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { FileViewProps, sortKeyTypes, SortOrder } from '@/types/Components/Tables';
import { useState, MouseEvent, useMemo } from 'react';
import FileItemRow from './FileItemRow';
import Table from '../UI/Table';
import { FileContextMenu } from '..';
import { File } from '@prisma/client';

const initalContextMenu = {
	show: false,
	x: 0,
	y: 0,
	selected: [] as File[],
};

export default function FileViewTable({ files, setFilePanelToShow, showMoreDetail = false }: FileViewProps) {
	const [sortKey, setSortKey] = useState<sortKeyTypes>('Name');
	const [sortOrder, setSortOrder] = useState<SortOrder>('ascn');
	const [contextMenu, setContextMenu] = useState(initalContextMenu);
	const [filesSelected, setFilesSelected] = useState<File[]>([]);
	const [allSelected, setAllSelected] = useState(false);

	function updateSortKey(key: sortKeyTypes) {
		if (sortKey === key) {
			setSortOrder(prev => prev === 'ascn' ? 'dscn' : 'ascn');
		} else {
			setSortKey(key);
			setSortOrder('ascn');
		}
	}

	const sortedFiles = useMemo(() => {
		const isAscending = sortOrder === 'ascn';
		const sorted = [...files];

		return sorted.sort((a, b) => {
			switch (sortKey) {
				case 'Name':
					return isAscending ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
				case 'Size':
					if (a.type === 'DIRECTORY' && b.type === 'DIRECTORY') {
						return isAscending
							? a._count.children - b._count.children
							: b._count.children - a._count.children;
					}
					if (a.type === 'FILE' && b.type === 'FILE') {
						return isAscending ? a.size - b.size : b.size - a.size;
					}
					return a.type === 'DIRECTORY' ? -1 : 1;
				case 'Date_Mod': {
					const dateA = new Date(a.createdAt).getTime();
					const dateB = new Date(b.createdAt).getTime();
					return isAscending ? dateA - dateB : dateB - dateA;
				}
				default:
					return 0;
			}
		});
	}, [files, sortKey, sortOrder]);

	function openContextMenu(e: MouseEvent<HTMLTableRowElement>, selected: File) {
		e.preventDefault();

		const menuWidth = 170;
		const menuHeight = 270;
		const windowWidth = window.innerWidth;
		const windowHeight = window.innerHeight;

		// Get the parent container's bounding box
		const parent = e.currentTarget.closest('table');
		const parentRect = parent?.getBoundingClientRect();

		// Calculate the correct position relative to the parent element
		let posX = e.clientX - (parentRect?.left || 0);
		let posY = e.clientY - (parentRect?.top || 0);

		// Prevent the menu from overflowing the viewport
		if (posX + menuWidth > windowWidth) posX = windowWidth - menuWidth;
		if (posY + menuHeight > windowHeight) posY = windowHeight - menuHeight;

		// Update this to support multi-selection
		if (filesSelected.length > 0) {
			setContextMenu({ show: true, x: posX, y: posY, selected: filesSelected });
		} else {
			setContextMenu({ show: true, x: posX, y: posY, selected: [selected] });
		}
	}
	const closeContextMenu = () => setContextMenu(initalContextMenu);

	function handleCheckboxToggle(e: MouseEvent, file: File) {
		e.stopPropagation();
		setFilesSelected((prevSelected) =>
			prevSelected.find((f) => f.name === file.name)
				? prevSelected.filter((f) => f.name !== file.name)
				: [...prevSelected, file],
		);
	}

	function handleSelectAllToggle() {
		if (allSelected) {
			// Uncheck all
			setFilesSelected([]);
		} else {
			// Select all files
			setFilesSelected(files);
		}
		setAllSelected(!allSelected);
	}

	return (
		<>
			{contextMenu.show && <FileContextMenu x={contextMenu.x} y={contextMenu.y} closeContextMenu={closeContextMenu} selected={contextMenu.selected} showFilePanel={(fileId) => setFilePanelToShow(fileId)} />}
			<Table>
				<Table.HeaderRow>
					<Table.Header style={{ width: '50px' }} className='hide-on-mobile text-center'>
						<input className="form-check-input" type="checkbox" name="exampleRadios" id="All" onChange={handleSelectAllToggle} />
					</Table.Header>
					<Table.Header id="Name" className="th-header" onClick={() => updateSortKey('Name')} style={{ cursor: 'pointer' }}>
          	Name <FontAwesomeIcon icon={sortKey == 'Name' ? (sortOrder == 'ascn' ? faSortUp : faSortDown) : faSort} />
					</Table.Header>
					<Table.Header id="Size" className="th-header" onClick={() => updateSortKey('Size')} style={{ cursor: 'pointer' }}>
          	Size <FontAwesomeIcon icon={sortKey == 'Size' ? (sortOrder == 'ascn' ? faSortUp : faSortDown) : faSort} />
					</Table.Header>
					<Table.Header id="Date modified" className="th-header hide-on-mobile" onClick={() => updateSortKey('Date_Mod')} style={{ cursor: 'pointer' }}>
          	Date modified <FontAwesomeIcon icon={sortKey == 'Date_Mod' ? (sortOrder == 'ascn' ? faSortUp : faSortDown) : faSort} />
					</Table.Header>
				</Table.HeaderRow>
				<Table.Body>
					{sortedFiles.filter(f => f.type == 'DIRECTORY').map(_ => (
						<FileItemRow key={_.name}
							file={_} showMoreDetail={showMoreDetail}
							isChecked={filesSelected.includes(_)} openContextMenu={openContextMenu}
							handleCheckboxToggle={handleCheckboxToggle} setShow={(fileId) => setFilePanelToShow(fileId)}
						/>
					))}
					{sortedFiles.filter(f => f.type == 'FILE').map(_ => (
						<FileItemRow key={_.name}
							file={_} showMoreDetail={showMoreDetail}
							isChecked={filesSelected.includes(_)} openContextMenu={openContextMenu}
							handleCheckboxToggle={handleCheckboxToggle} setShow={(fileId) => setFilePanelToShow(fileId)}
						/>
					))}
				</Table.Body>
			</Table>
		</>
	);
}