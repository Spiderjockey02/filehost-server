import { faCopy, faDownload, faFileSignature, faFolderOpen, faShareAlt, faTrash } from '@fortawesome/free-solid-svg-icons';
import { DeleteFileModal, RenameFileModal, UpdateLocationModal } from '@/components/Modals';
import type { FilePanelPopupProps } from '@/types/Components/Views';
import type { HoverElementProps } from '@/types/Components/Navbars';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { OverlayTrigger, Tooltip } from 'react-bootstrap';
import { formatBytes } from '@/utils/functions';
import { useRouter } from 'next/router';
import { useState } from 'react';
import Image from 'next/image';
import axios from 'axios';
import path from 'path';

export default function FilePanelPopup({ file, setShow, show }: FilePanelPopupProps) {
	const [activeModal, setActiveModal] = useState<string | null>(null);
	const router = useRouter();
	const handleRowClick = () => router.push(`/files${file.path}`);
	const imageLoader = () => path.join('/thumbnail', file.userId, file.path);

	const HoverElement = ({ title, children }: HoverElementProps) => (
		<OverlayTrigger placement='top' overlay={<Tooltip>{title}</Tooltip>}>
			{children}
		</OverlayTrigger>
	);

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
			{activeModal == 'delete' && <DeleteFileModal file={file} show={true} onClose={() => setActiveModal(null)} />}
			{activeModal == 'change' && <UpdateLocationModal file={file} show={true} onClose={() => setActiveModal(null)} />}
			{activeModal == 'rename' && <RenameFileModal file={file} show={true} onClose={() => setActiveModal(null)} />}
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
							<HoverElement title="Share">
								<FontAwesomeIcon icon={faShareAlt} />
							</HoverElement>
						</button>
						<button className='btn' onClick={handleCopyURL}>
							<HoverElement title="Copy">
								<FontAwesomeIcon icon={faCopy} />
							</HoverElement>
						</button>
						<button className='btn' onClick={handleDownload}>
							<HoverElement title="Download">
								<FontAwesomeIcon icon={faDownload} />
							</HoverElement>
						</button>
						<button className='btn' onClick={() => setActiveModal('delete')}>
							<HoverElement title="Delete">
								<FontAwesomeIcon icon={faTrash} />
							</HoverElement>
						</button>
						<button className='btn' onClick={() => setActiveModal('change')}>
							<HoverElement title="Change">
								<FontAwesomeIcon icon={faFolderOpen} />
							</HoverElement>
						</button>
						<button className="btn" onClick={() => setActiveModal('rename')}>
							<HoverElement title="Rename">
								<FontAwesomeIcon icon={faFileSignature} />
							</HoverElement>
						</button>
					</div>
				</div>
			</div>
		</>
	);
}