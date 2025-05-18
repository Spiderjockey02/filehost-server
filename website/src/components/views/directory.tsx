import { DragUploadField, FilePanelPopup, FileViewTable } from '@/components';
import type { FileWithChildren } from '@/types/database';
import { useState } from 'react';

interface Props {
  folder: FileWithChildren
}


export default function Directory({ folder }: Props) {
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
