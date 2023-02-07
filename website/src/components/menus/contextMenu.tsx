import { useRef } from 'react';
import { useOnClickOutside } from '../../utils/useOnClickOutisde';
interface Props {
	x: number
	y: number
	selected: string
	closeContextMenu: () => void
}

export default function ContextMenu({ x, y, closeContextMenu, selected }: Props) {
	const contextMenuRef = useRef<HTMLDivElement>(null);
	useOnClickOutside(contextMenuRef, closeContextMenu);

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
				<button className="btn btn-ctx-menu" data-toggle="modal" data-target="#changeModel"><i className="fas fa-copy"></i> Move / Copy to</button>
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
							<form action="/files/delete" method="post" id='uploadForm'>
								<input type="hidden" id="deleteInput" name="path" />
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
		        <form action="/files/rename" method="post">
							<div className="modal-body">
								<input type="hidden" id="oldName" name="oldName" value={selected} />
		            <input type="hidden" id="folder" name="folder" value="{{FOLDER}}" />
								<div className="input-group mb-3">
		              <input className="form-control" id="renameInput" type="text" name="newName" placeholder={selected} />
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
		</>
	);
}
