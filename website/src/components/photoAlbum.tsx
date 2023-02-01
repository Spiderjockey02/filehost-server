import type { fileItem } from '../utils/types';
import Link from 'next/link';
import Image from 'next/image';

interface Props {
  files: fileItem[]
}

export default function Header({ files }: Props) {

	return (
		<div className="row justify-content-start">
			{files.map(_ => (
				<div className="col-sm" style={{ marginBottom: '10px' }} key={_.name}>
					<Link href="/files">
						<Image className="center" src="/thumbnail" style={{ width:'auto', maxWidth:'200px', height:'auto', maxHeight:'275px' }} alt={_.name} width="200" height="230" />
					</Link>
				</div>
			))}
		</div>
	);
}
