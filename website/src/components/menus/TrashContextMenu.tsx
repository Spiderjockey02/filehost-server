import { faRotateLeft, faTrash } from '@fortawesome/free-solid-svg-icons';
import type { TrashContextMenuProps } from '@/types/Components/Menu';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useOnClickOutside } from '@/utils/useOnClickOutisde';
import ContextMenu from '../UI/ContextMenu';
import { useRef, RefObject } from 'react';
import axios from 'axios';

export default function TrashContextMenu({ x, y, closeContextMenu, selected }: TrashContextMenuProps) {
	const contextMenuRef = useRef<HTMLDivElement>(null);
	useOnClickOutside(contextMenuRef as RefObject<HTMLDivElement>, closeContextMenu);

	const handleEmptyBin = async () => {
		try {
			await axios.delete('/api/trash/empty');
		} catch (err) {
			console.error('Error emptying bin:', err);
		}
	};

	const handleRestore = async () => {
		try {
			await axios.put('/api/trash/restore', { paths: selected.map(s => s.path) });
		} catch (err) {
			console.error('Error restoring files:', err);
		}
	};

	return (
		<ContextMenu x={x} y={y} ref={contextMenuRef}>
			<ContextMenu.Button onClick={handleEmptyBin}>
				<FontAwesomeIcon icon={faTrash} /> Empty Bin
			</ContextMenu.Button>
			<ContextMenu.Button onClick={handleRestore}>
				<FontAwesomeIcon icon={faRotateLeft} /> Restore
			</ContextMenu.Button>
		</ContextMenu>
	);
}