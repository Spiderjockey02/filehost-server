import { DragUploadField, FilePanelPopup, FileViewTable } from '@/components';
import type { DirectoryProps } from '@/types/Components/Views';
import { useState } from 'react';

export default function Directory({ folder }: DirectoryProps) {
	const [filePanelToShow, setFilePanelToShow] = useState('');

	return (
		<DragUploadField parentId={folder.id}>
			{folder.children.map((_) => (
				filePanelToShow == _.id && (
					<>
						{/* @ts-expect-error sdfhjk */}
						<FilePanelPopup key={_.id} file={_} show={filePanelToShow == _.id} setShow={(s) => setFilePanelToShow(s)} />
					</>
				)
			))}
			{/* @ts-expect-error sdfhjk */}
			<FileViewTable files={folder.children}
				setFilePanelToShow={setFilePanelToShow} />
		</DragUploadField>
	);
}
