import { FilePanelPopup, FileViewTable } from '@/components';
import { useCallback, useEffect, useState } from 'react';
import { GetServerSidePropsContext } from 'next/types';
import { AuthOption } from './api/auth/[...nextauth]';
import { SearchPageProps } from '@/types/pages';
import { useSession } from 'next-auth/react';
import { getServerSession } from 'next-auth';
import FileLayout from '@/layouts/file';
import { fileItem } from '@/types';
import axios from 'axios';

export default function Search({ query: { query, fileType, dateUpdated } }: SearchPageProps) {
	const { data: session, status } = useSession({ required: true });
	const [files, setFiles] = useState<fileItem[]>([]);
	const [filePanelToShow, setFilePanelToShow] = useState('');

	const fetchFiles = useCallback(async () => {
		try {
			const { data } = await axios.get(`/api/files/search?query=${query}&fileType=${fileType}&updatedSince=${dateUpdated}`);
			setFiles(data.query);
		} catch (err) {
			console.log(err);
		}
	}, [query, fileType, dateUpdated]);

	useEffect(() => {
		fetchFiles();
	}, [fetchFiles]);

	if (status == 'loading') return null;
	return (
		<FileLayout user={session.user}>
			<h4><b>Search for: {query}</b></h4>
			{files.map((_) => (
				filePanelToShow == _.id && <FilePanelPopup key={_.id} file={_} show={filePanelToShow == _.id} setShow={(s) => setFilePanelToShow(s)} />
			))}
			<FileViewTable files={files} setFilePanelToShow={setFilePanelToShow} showMoreDetail={true} />
		</FileLayout>
	);
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
	const session = await getServerSession(context.req, context.res, AuthOption);
	if (session == null) return;
	return { props: { query: context.query } };
}