import { DragUploadField, FilePanelPopup, FileViewTable } from '@/components';
import type { fileItem } from '../../types';
import { useState } from 'react';

interface Props {
  folder: fileItem
}


export default function Directory({ folder }: Props) {
	const [filePanelToShow, setFilePanelToShow] = useState('');

	return (
		<DragUploadField path={folder.path}>
			{folder.children.map((_) => (
				filePanelToShow == _.id && <FilePanelPopup key={_.id} file={_} show={filePanelToShow == _.id} setShow={(s) => setFilePanelToShow(s)} />
			))}
			<FileViewTable files={folder.children}
				setFilePanelToShow={setFilePanelToShow} />
		</DragUploadField>
	);
}
