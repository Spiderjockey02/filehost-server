import Image from 'next/image';
import { faCopy, faDownload, faFileSignature, faFolderOpen, faShareAlt, faTrash } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import path from 'path';
import { formatBytes } from '@/utils/functions';
import { useRouter } from 'next/router';
import axios from 'axios';
import ChangeModal from '../Modals/UpdateLocationModal';
import DeleteFileModal from '../Modals/DeleteFileModal';
import RenameModal from '../Modals/RenameFileModal';
import { FileWithCount } from '@/types/database';

interface Props {
  file: FileWithCount
  setShow: (fileName: string) => void
  show: boolean
}

export default function FilePanelPopup({ file, setShow, show }: Props) {
	const router = useRouter();
	const handleRowClick = () => router.push(`/files${file.path}`);
	const imageLoader = () => path.join('/thumbnail', file.userId, file.path);

	const handleDownload = async () => {
		try {
			const { data: blob } = await axios.get(`/api/files/download?path=${file.path}`, {
				headers: {
					'Accept': 'application/zip',
				},
				responseType: 'blob',
			});

			if (blob.size > 0) {
				const url = window.URL.createObjectURL(blob);
				const link = document.createElement('a');
				link.href = url;

				// Specify the file name for the downloaded file
				link.download = file.name;
				document.body.appendChild(link);
				link.click();
				link.remove();

				// Clean up the URL object
				window.URL.revokeObjectURL(url);
			} else {
				throw new Error('Download failed: Empty file');
			}
		} catch (error) {
			console.log(error);
		}
	};

	const handleCopyURL = async () => {
		const url = `${window.location.origin}${window.location.pathname}/${encodeURI(file.name)}`;
		const unsecuredCopyToClipboard = (text: string) => {
			const textArea = document.createElement('textarea');
			textArea.value = text;
			document.body.appendChild(textArea);
			textArea.focus();
			textArea.select();
			try {
				document.execCommand('copy');
			} catch(err) {
				console.error('Unable to copy to clipboard', err);
			}
			document.body.removeChild(textArea);
		};
		if (window.isSecureContext && navigator.clipboard) {
			navigator.clipboard.writeText(url);
		} else {
			unsecuredCopyToClipboard(url);
		}
	};

	return (
		<>
			<RenameModal key={file.id} file={file} />
			<ChangeModal key={file.id} file={file} />
			<DeleteFileModal key={file.id} file={file} />
			<div className={`offcanvas offcanvas-end ${show ? 'show' : ''}`} id="offcanvasExample" aria-labelledby="offcanvasExampleLabel" style={{ maxWidth: '50%' }}>
				<div className="offcanvas-header">
					<h5 className="offcanvas-title" id="offcanvasExampleLabel">File preview</h5>
					<button type="button" className="btn-close text-reset" data-bs-dismiss="offcanvas" aria-label="Close" onClick={() => setShow('')}></button>
				</div>
				<div className="offcanvas-body" style={{ padding: '3px' }}>
					<div className='container justify-content-center text-center'>
						<span onClick={handleRowClick} style={{ cursor: 'pointer' }}>
							<Image src={file.name} alt={file.name} style={{ maxWidth: '100%', height: 'auto', border: '1px solid black' }} width={300} height={600} loader={imageLoader} loading='lazy' />
							<br />
							<h4 className='text-break'>{file.name}</h4>
						</span>
						<p>Created on: {new Date(file.createdAt).toLocaleString('en-US')}</p>
						<p>{file.type == 'FILE' ? formatBytes(file.size) : `${file._count?.children ?? 0} files`}</p>
					</div>
					<div className='d-flex flex-wrap justify-content-evenly'>
						<button className='btn'>
							<FontAwesomeIcon icon={faShareAlt} />
						</button>
						<button className='btn' onClick={handleCopyURL}>
							<FontAwesomeIcon icon={faCopy} />
						</button>
						<button className='btn' onClick={handleDownload}>
							<FontAwesomeIcon icon={faDownload} />
						</button>
						<button className='btn' data-bs-toggle="modal" data-bs-target={`#delete_${file.id}`}>
							<FontAwesomeIcon icon={faTrash} />
						</button>
						<button className='btn' data-bs-toggle="modal" data-bs-target={`#change_${file.id}`}>
							<FontAwesomeIcon icon={faFolderOpen} />
						</button>
						<button className="btn" type="button" data-bs-toggle="modal" data-bs-target={`#rename_${file.id}`}>
							<FontAwesomeIcon icon={faFileSignature} />
						</button>
					</div>
				</div>
			</div>
		</>
	);
}