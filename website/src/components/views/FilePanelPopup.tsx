import { faCopy, faDownload, faFileSignature, faFolderOpen, faShareAlt, faTrash } from '@fortawesome/free-solid-svg-icons';
import type { FilePanelPopupProps } from '@/types/Components/Views';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import ChangeModal from '../Modals/UpdateLocationModal';
import DeleteFileModal from '../Modals/DeleteFileModal';
import RenameModal from '../Modals/RenameFileModal';
import { formatBytes } from '@/utils/functions';
import { useRouter } from 'next/router';
import Image from 'next/image';
import axios from 'axios';
import path from 'path';

export default function FilePanelPopup({ file, setShow, show }: FilePanelPopupProps) {
	const router = useRouter();
	const handleRowClick = () => router.push(`/files${file.path}`);
	const imageLoader = () => path.join('/thumbnail', file.userId, file.path);

	const handleDownload = async () => {
		try {
			const { data: blob } = await axios.post('/api/files/download',
				{ id: `${file.id}` },
				{
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
							<Image src={file.name} alt={file.name} style={{ maxWidth: '100%', height: 'auto', border: '1px solid black' }} width={300} height={390} loader={imageLoader} loading='lazy' />
							<br />
							<h4 className='text-break'>{file.name}</h4>
						</span>
						<p>Created on: {new Date(file.createdAt).toLocaleString('en-US')}</p>
						<p>{file.type == 'FILE' ? formatBytes(file.size) : `${file._count?.children ?? 0} files`}</p>
					</div>
					<div className='d-flex flex-wrap justify-content-evenly'>
						<button className='btn'>
							<span data-bs-toggle="tooltip" data-bs-placement="top" title="Share"><FontAwesomeIcon icon={faShareAlt} /></span>
						</button>
						<button className='btn' onClick={handleCopyURL} >
							<span data-bs-toggle="tooltip" data-bs-placement="top" title="Copy"><FontAwesomeIcon icon={faCopy} /></span>
						</button>
						<button className='btn' onClick={handleDownload} >
							<span data-bs-toggle="tooltip" data-bs-placement="top" title="Download"><FontAwesomeIcon icon={faDownload}/></span>
						</button>
						<button className='btn' data-bs-toggle="modal" data-bs-target={`#delete_${file.id}`}>
							<span data-bs-toggle="tooltip" data-bs-placement="top" title="Delete"><FontAwesomeIcon icon={faTrash} /></span>
						</button>
						<button className='btn' data-bs-toggle="modal" data-bs-target={`#change_${file.id}`}>
							<span data-bs-toggle="tooltip" data-bs-placement="top" title="Change"><FontAwesomeIcon icon={faFolderOpen} /></span>
						</button>
						<button className="btn" type="button" data-bs-toggle="modal" data-bs-target={`#rename_${file.id}`}>
							<span data-bs-toggle="tooltip" data-bs-placement="top" title="Rename"><FontAwesomeIcon icon={faFileSignature} /></span>
						</button>
					</div>
				</div>
			</div>
		</>
	);
}