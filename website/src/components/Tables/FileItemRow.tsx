import { getFileIcon, formatBytes } from '@/utils/functions';
import type { FileItemRowProps } from '@/types/Components/Tables';
import FileDetail from './FileDetailCell';
import { useRouter } from 'next/router';
import type { MouseEvent }from 'react';
import Link from 'next/link';

export default function FileItemRow({ file, isChecked, openContextMenu, handleCheckboxToggle, setShow, showMoreDetail = false }: FileItemRowProps) {
	const router = useRouter();
	const handleRowClick = () => router.push(`/files${file.path}`);

	const handleTextClick = (e: MouseEvent) => {
		e.stopPropagation();
		setShow(file.id);
	};

	return (
		<>
			<tr key={file.name} style={{ cursor: 'pointer' }} onContextMenu={(e) => openContextMenu(e, file)} onClick={handleRowClick}>
				<th className='text-center hide-on-mobile'>
					<input className="form-check-input" type="checkbox" id={encodeURI(file.name)} checked={isChecked} readOnly={true} onClick={(e) => handleCheckboxToggle(e, file)} />
				</th>
				<th scope="row" className="text-truncate" style={{ maxWidth: '50vw' }}>
					{showMoreDetail ?
						<FileDetail file={file} /> :
						<Link onClick={handleTextClick} style={{ textDecoration: 'none', color: 'black' }} href="#">{getFileIcon(file)} {file.name}</Link>
					}
				</th>
				<td>{file.type == 'FILE' ? formatBytes(file.size) : `${file._count.children} files`}</td>
				<td className='hide-on-mobile'>{new Date(file.createdAt).toLocaleString()}</td>
			</tr>
		</>
	);
}