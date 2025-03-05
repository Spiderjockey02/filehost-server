import { faSort, faSortDown, faSortUp } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { FileViewProps, sortKeyTypes, SortOrder } from '@/types/Components/Tables';
import { useEffect, useState, MouseEvent } from 'react';
import FileItemRow from './FileItemRow';
import Table from '../UI/Table';
import { fileItem } from '@/types';
import { FileContextMenu } from '..';

const initalContextMenu = {
	show: false,
	x: 0,
	y: 0,
	selected: [] as fileItem[],
};

export default function FileViewTable({ files, setFilePanelToShow, showMoreDetail = false }: FileViewProps) {
	const [sortKey, setSortKey] = useState<sortKeyTypes>('Name');
	const [sortOrder, setSortOrder] = useState<SortOrder>('ascn');
	const [contextMenu, setContextMenu] = useState(initalContextMenu);
	const [filesSelected, setFilesSelected] = useState<fileItem[]>([]);
	const [allSelected, setAllSelected] = useState(false);

	function updateSortKey(sort: sortKeyTypes) {
		switch(sort) {
			case 'Name': {
				const isAscending = sortOrder === 'ascn';
				setSortOrder(isAscending ? 'dscn' : 'ascn');

				files = files.sort((a, b) => {
					return isAscending ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
				});

				setSortKey(sort);
				break;
			}
			case 'Size': {
				const isAscending = sortOrder === 'ascn';
				setSortOrder(isAscending ? 'dscn' : 'ascn');

				files = files.sort((a, b) => {
					if (a.type === 'DIRECTORY' && b.type === 'DIRECTORY') {
						return isAscending
							? a._count.children - b._count.children
							: b._count.children - a._count.children;
					} else if (a.type === 'FILE' && b.type === 'FILE') {
						return isAscending
							? a.size - b.size
							: b.size - a.size;
					} else {
						return a.type === 'DIRECTORY' ? -1 : 1;
					}
				});

				setSortKey(sort);
				break;
			}
			case 'Date_Mod': {
				const isAscending = sortOrder === 'ascn';
				setSortOrder(isAscending ? 'dscn' : 'ascn');

				files = files.sort((a, b) => {
					const dateA = new Date(a.createdAt);
					const dateB = new Date(b.createdAt);
					return isAscending ? dateA.getTime() - dateB.getTime() : dateB.getTime() - dateA.getTime();
				});
				setSortKey(sort);
				break;
			}
		}
	}

	function openContextMenu(e: MouseEvent<HTMLTableRowElement>, selected: fileItem) {
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

	function handleCheckboxToggle(e: MouseEvent, file: fileItem) {
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

	useEffect(() => {
		updateSortKey(sortKey);
	}, []);

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
					{files.filter(f => f.type == 'DIRECTORY').map(_ => (
						<FileItemRow key={_.name}
							file={_} showMoreDetail={showMoreDetail}
							isChecked={filesSelected.includes(_)} openContextMenu={openContextMenu}
							handleCheckboxToggle={handleCheckboxToggle} setShow={(fileId) => setFilePanelToShow(fileId)}
						/>
					))}
					{files.filter(f => f.type == 'FILE').map(_ => (
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