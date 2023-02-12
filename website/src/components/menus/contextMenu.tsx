import { useRef } from 'react';
import { useOnClickOutside } from '../../utils/useOnClickOutisde';
import { useSession } from 'next-auth/react';
import type { User } from '@prisma/client';
import type { BaseSyntheticEvent } from 'react';
import { useRouter } from 'next/router';
interface Props {
	x: number
	y: number
	selected: string
	closeContextMenu: () => void
}

export default function ContextMenu({ x, y, closeContextMenu, selected }: Props) {
	const contextMenuRef = useRef<HTMLDivElement>(null);
	const { data: session, status } = useSession();
	const router = useRouter();

	useOnClickOutside(contextMenuRef, closeContextMenu);
	if (status == 'loading') return null;

	function closeModal(id: string) {
		document.getElementById(id)?.classList.remove('show');
		document.getElementById(id)?.setAttribute('aria-hidden', 'true');
		document.getElementById(id)?.setAttribute('style', 'display: none');
		document.body.removeChild(document.getElementsByClassName('modal-backdrop')[0] as Node);
		closeContextMenu();
		router.reload();
	}

	const handleRenameSubmit = async (event: BaseSyntheticEvent) => {
		event.preventDefault();
		const oldPath = (document.getElementById('oldPath') as HTMLInputElement).value;
		const newPath = (document.getElementById('renameInput') as HTMLInputElement).value;

		await fetch(`/api/files/rename/${(session?.user as User).id}`, {
			method: 'post',
			headers: {
				'content-type': 'application/json;charset=UTF-8',
			},
			body: JSON.stringify({ oldPath, newPath }),
		});
		closeModal('renameModel');
	};

	const handleDeleteSubmit = async (event: BaseSyntheticEvent) => {
		event.preventDefault();
		await fetch(`/api/files/delete/${(session?.user as User).id}`, {
			method: 'post',
			headers: {
				'content-type': 'application/json;charset=UTF-8',
			},
			body: JSON.stringify({ path: selected }),
		});
		closeModal('deleteModel');
	};

	return (
		<>
			<div className="ctxmenu" ref={contextMenuRef} style={{ top: `${y}px`, left: `${x}px`, zIndex: 20, position: 'absolute' }}>
				<button className="btn btn-ctx-menu">
					<i className="fas fa-share-alt"></i> Share
				</button>
				<button className="btn btn-ctx-menu" data-toggle="modal" data-target="#copyURLModel"><i className="fas fa-copy"></i> Copy link</button>
				<button className="btn btn-ctx-menu">
					<i className="fas fa-download"></i> Download
				</button>
				<button type="button" className="btn btn-ctx-menu" data-bs-toggle="modal" data-bs-target="#deleteModel">
			  	<i className="fas fa-trash"></i> Delete
				</button>
				<button className="btn btn-ctx-menu" data-bs-toggle="modal" data-bs-target="#changeModel"><i className="fas fa-copy"></i> Move / Copy to</button>
				<button className="btn btn-ctx-menu" type="button" data-bs-toggle="modal" data-bs-target="#renameModel"><i className="fas fa-file-signature"></i> Rename</button>
				<button className="btn btn-ctx-menu"><i className="fas fa-ellipsis-v"></i> Details</button>
			</div>

			<div className="modal fade" id="deleteModel" aria-labelledby="exampleModalLabel" aria-hidden="true">
				<div className="modal-dialog modal-dialog-centered">
					<div className="modal-content">
						<div className="modal-header">
							<h5 className="modal-title" id="DeleteTitle">Delete {selected}?</h5>
							<button type="button" className="close" data-bs-dismiss="modal" aria-label="Close">
								<span aria-hidden="true">&times;</span>
							</button>
						</div>
						<div className="modal-body">
        			Are you sure you want to send this item to the recycle bin?
						</div>
						<div className="modal-footer">
							<form onSubmit={handleDeleteSubmit} method="post">
								<button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Close</button>
								<button className="btn btn-primary" type="submit" id="imagefile">Delete</button>
							</form>
						</div>
					</div>
				</div>
			</div>

			<div className="modal fade" id="renameModel" role="dialog" aria-labelledby="exampleModalCenterTitle" aria-hidden="true">
		    <div className="modal-dialog modal-dialog-centered" role="document">
		      <div className="modal-content">
		        <div className="modal-header">
		          <h5 className="modal-title" id="exampleModalLongTitle">Rename {selected}</h5>
		          <button type="button" className="close" data-bs-dismiss="modal" aria-label="Close">
		            <span aria-hidden="true">&times;</span>
		          </button>
		        </div>
		        <form onSubmit={handleRenameSubmit} method="post">
							<div className="modal-body">
								<input type="hidden" id="oldPath" name="oldPath" value={selected} />
								<div className="input-group mb-3">
		              <input className="form-control" id="renameInput" type="text" name="newPath" placeholder={selected} />
		              <span className="input-group-text" id="renameSuffix">.{selected.split('.').splice(-1)}</span>
		            </div>
							</div>
							<div className="modal-footer">
		            <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Close</button>
		            <button type="submit" className="btn btn-primary">Save changes</button>
		          </div>
		        </form>
		    	</div>
		  	</div>
			</div>

			<div className="modal fade" id="changeModel" role="dialog" aria-labelledby="exampleModalCenterTitle" aria-hidden="true">
				<div className="modal-dialog modal-dialog-centered" role="document">
					<div className="modal-content">
						<div className="modal-header">
							<h5 className="modal-title" id="exampleModalLongTitle">Move or Copy {selected}</h5>
							<button type="button" className="close" data-bs-dismiss="modal" aria-label="Close">
								<span aria-hidden="true">&times;</span>
							</button>
						</div>
						<form action="/files/change" method="post">
							<div className="modal-body w-100">
								<p>Select a destination folder.</p>
								<input className="form-input" type="text" placeholder="Search folders" />
								<div id="folderList"></div>
							</div>
							<div className="modal-footer">
								<button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
								<button type="submit" className="btn btn-primary">Move</button>
								<button type="submit" className="btn btn-primary">Copy</button>
							</div>
						</form>
					</div>
				</div>
			</div>
		</>
	);
}
