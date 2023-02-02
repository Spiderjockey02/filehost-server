import type { fileItem } from '../utils/types';
import { formatBytes, getFileIcon } from '../utils/functions';
import Link from 'next/link';

interface Props {
  files: fileItem
  dir: string
}

export default function Directory({ files, dir }: Props) {

	return (
		<table className="table" id="myTable">
			<thead>
				<tr>
					<th scope="col" style={{ width:'5%', textAlign:'center' }} className="dot">
						<div className="form-check form-check-inline hide">
							<input className="form-check-input" type="checkbox" name="exampleRadios" id="All" data-option="0" />
						</div>
					</th>
					<th id="Type" scope="col" style={{ width:'5%', textAlign:'center' }}>
						<i className="far fa-file"></i>
					</th>
					<th id="Name" scope="col">Name <i className="bi bi-arrow-down-up"></i></th>
					<th id="Size" scope="col">Size <i className="bi bi-arrow-down-up"></i></th>
					<th id="Date modified" scope="col">Date modified <i className="bi bi-arrow-down-up"></i></th>
				</tr>
			</thead>
			<tbody>
				{files.children.filter(f => f.type == 'directory').map(_ => (
					<tr key={_.name}>
						<th className="dot" style={{ textAlign:'center' }}>
							<div className="form-check form-check-inline hide">
								<input className="form-check-input" type="checkbox" name="exampleRadios" data-option="0" />
							</div>
						</th>
						<th id="Type" scope="col" style={{ textAlign:'center' }} dangerouslySetInnerHTML={{ __html: getFileIcon(_) }}></th>
						<th scope="row" className="text-truncate" style={{ maxWidth: 'calc( 70 * 1vw )' }}>
							<Link href={`/files${dir == '/' ? '/' : `/${dir}/`}${_.name}`}>{_.name}</Link>
						</th>
						<td data-trueValue={_.children?.length ?? 0}>{_.children?.length ?? 0} file{_.children?.length !== 1 ? 's' : ''}</td>
						<td data-trueValue={new Date(_.modified).getTime()}>{new Date(_.modified).toLocaleString('en-US')}</td>
					</tr>
				))}

				{files.children.filter(f => f.type == 'file').map(_ => (
					<tr key={_.name}>
						<th className="dot" style={{ textAlign:'center' }}>
							<div className="form-check form-check-inline hide">
								<input className="form-check-input" type="checkbox" name="exampleRadios" id="<%= encodeURI(file.name) %>" data-option="0" />
							</div>
						</th>
						<th id="Type" scope="col" style={{ textAlign:'center' }} dangerouslySetInnerHTML={{ __html: getFileIcon(_) }}></th>
						<th scope="row" className="text-truncate" style={{ maxWidth: 'calc( 70 * 1vw )' }}>
							<Link href={`/files${dir == '/' ? '/' : `/${dir}/`}${_.name}`}>{_.name}</Link>
						</th>
						<td data-trueValue={_.size}>{formatBytes(_.size)}</td>
						<td data-trueValue={new Date(_.modified).getTime()}>{new Date(_.modified).toLocaleString('en-US')}</td>
					</tr>
				))}
			</tbody>
		</table>
	);
}
