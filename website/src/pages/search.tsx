import { FilePanelPopup, FileViewTable } from '@/components';
import { useCallback, useEffect, useState } from 'react';
import { GetServerSidePropsContext } from 'next/types';
import { authClient } from '@/auth/client';
import { SearchPageProps } from '@/types/pages';
import FileLayout from '@/layouts/file';
import { fileItem } from '@/types';
import { auth } from '@/auth/server';
import axios from 'axios';

export default function Search({ query: { query, fileType, dateUpdated } }: SearchPageProps) {
	const { data: session } = authClient.useSession();
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

	if (session == null) return null;
	return (
		<FileLayout user={session.user} active='files'>
			<h4><b>Search for: {query}</b></h4>
			{files.map((_) => (
				filePanelToShow == _.id && <FilePanelPopup key={_.id} file={_} show={filePanelToShow == _.id} setShow={(s) => setFilePanelToShow(s)} />
			))}
			<FileViewTable files={files} setFilePanelToShow={setFilePanelToShow} showMoreDetail={true} />
		</FileLayout>
	);
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
	// Last check to ensure the user is authenticated
	const session = await auth.api.getSession({
		headers: new Headers({
			cookie: context.req.headers.cookie || '',
		}),
	});
	
	if (session == null) return;
	return { props: { query: context.query } };
}