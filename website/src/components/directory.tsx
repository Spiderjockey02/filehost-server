import type { fileItem } from '../utils/types';
import { formatBytes, getFileIcon } from '../utils/functions';
import Link from 'next/link';
import { useState } from 'react';
import ContextMenu from '../components/menus/contextMenu';
import type { MouseEvent } from 'react';
type sortKeyTypes = 'Name' | 'Size' | 'Date_Mod';
type SortOrder = 'ascn' | 'dscn';
interface Props {
  files: fileItem
  dir: string
}

const initalContextMenu = {
	show: false,
	x: 0,
	y: 0,
	selected: '',
};

export default function Directory({ files, dir }: Props) {
	const [sortKey, setSortKey] = useState<sortKeyTypes>('Name');
	const [sortOrder, setSortOrder] = useState<SortOrder>('ascn');
	const [contextMenu, setContextMenu] = useState(initalContextMenu);

	function updateSortKey(sort: sortKeyTypes) {
		switch(sort) {
			case 'Name': {
				setSortOrder(sortOrder == 'ascn' ? 'dscn' : 'ascn');
				if (sortOrder == 'ascn') {
					files.children = files.children.sort((a, b) => a.name > b.name ? 1 : -1);
				} else {
					files.children = files.children.sort((a, b) => a.name < b.name ? 1 : -1);
				}
				setSortKey(sort);
				break;
			}
			case 'Size': {
				setSortOrder(sortOrder == 'ascn' ? 'dscn' : 'ascn');
				if (sortOrder == 'ascn') {
					files.children = files.children.sort((a, b) => a.size > b.size ? 1 : -1);
				} else {
					files.children = files.children.sort((a, b) => a.size < b.size ? 1 : -1);
				}
				setSortKey(sort);
				break;
			}
			case 'Date_Mod': {
				setSortOrder(sortOrder == 'ascn' ? 'dscn' : 'ascn');
				if (sortOrder == 'ascn') {
					files.children = files.children.sort((a, b) => a.modified > b.modified ? 1 : -1);
				} else {
					files.children = files.children.sort((a, b) => a.modified < b.modified ? 1 : -1);
				}
				setSortKey(sort);
				break;
			}
		}
	}

	function openContextMenu(e: MouseEvent<HTMLTableRowElement>, selected: string) {
		e.preventDefault();
		const { pageX, pageY } = e;
		setContextMenu({ show: true, x: pageX, y: pageY, selected });
	}

	const closeContextMenu = () => setContextMenu(initalContextMenu);

	return (
		<div>
			{contextMenu.show &&	<ContextMenu x={contextMenu.x} y={contextMenu.y} closeContextMenu={closeContextMenu} selected={contextMenu.selected} />}
			<table className="table" id="myTable">
				<thead>
					<tr>
						<th scope="col" className="th-header dot" style={{ width:'5%', textAlign:'center', borderTopLeftRadius: '5px' }}>
							<div className="form-check form-check-inline hide">
								<input className="form-check-input" type="checkbox" name="exampleRadios" id="All" data-option="0" />
							</div>
						</th>
						<th id="Type" className="th-header" scope="col" style={{ width:'5%', textAlign:'center' }}>
							<i className="far fa-file"></i>
						</th>
						<th id="Name" className="th-header" scope="col" onClick={() => updateSortKey('Name')}>
              Name <i className="bi bi-arrow-down-up"></i>
						</th>
						<th id="Size" className="th-header" scope="col" onClick={() => updateSortKey('Size')}>
              Size <i className="bi bi-arrow-down-up"></i>
						</th>
						<th id="Date modified" className="th-header" style={{ borderTopRightRadius: '5px' }} scope="col" onClick={() => updateSortKey('Date_Mod')} >
              Date modified <i className="bi bi-arrow-down-up"></i>
						</th>
					</tr>
				</thead>
				<tbody>
					{files.children.filter(f => f.type == 'directory').map(_ => (
						<tr key={_.name} onContextMenu={(e) => openContextMenu(e, _.name)}>
							<th className="dot" style={{ textAlign:'center' }}>
								<div className="form-check form-check-inline hide">
									<input className="form-check-input" type="checkbox" name="exampleRadios" data-option="0" />
								</div>
							</th>
							<th id="Type" scope="col" style={{ textAlign:'center' }} dangerouslySetInnerHTML={{ __html: getFileIcon(_) }}></th>
							<th scope="row" className="text-truncate" style={{ maxWidth: 'calc( 70 * 1vw )' }}>
								<Link href={`/files${dir == '/' ? '/' : `/${dir}/`}${_.name}`}>{_.name}</Link>
							</th>
							<td>{_.children?.length ?? 0} file{_.children?.length !== 1 ? 's' : ''}</td>
							<td>{new Date(_.modified).toLocaleString('en-US')}</td>
						</tr>
					))}

					{files.children.filter(f => f.type == 'file').map(_ => (
						<tr key={_.name} onContextMenu={(e) => openContextMenu(e, _.name)}>
							<th className="dot" style={{ textAlign:'center' }}>
								<div className="form-check form-check-inline hide">
									<input className="form-check-input" type="checkbox" name="exampleRadios" id={encodeURI(_.name)} data-option="0" />
								</div>
							</th>
							<th id="Type" scope="col" style={{ textAlign:'center' }} dangerouslySetInnerHTML={{ __html: getFileIcon(_) }}></th>
							<th scope="row" className="text-truncate" style={{ maxWidth: 'calc( 70 * 1vw )' }}>
								<Link href={`/files${dir == '/' ? '/' : `/${dir}/`}${_.name}`}>{_.name}</Link>
							</th>
							<td>{formatBytes(_.size)}</td>
							<td>{new Date(_.modified).toLocaleString('en-US')}</td>
						</tr>
					))}
				</tbody>
			</table>
			<style>
				{`
          .th-header:hover {
            background-color: grey;
            cursor: pointer;
          }
          tbody tr:hover {
            border-radius: 15px;
            cursor: pointer;
            box-shadow: 0px 0px 1px 1px #999;
          }
          `}
			</style>
		</div>
	);
}
