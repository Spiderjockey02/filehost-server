import { FilePanelPopup, FileViewTable } from '@/components';
import { useCallback, useEffect, useState } from 'react';
import { GetServerSidePropsContext } from 'next/types';
import { authClient } from '@/auth/client';
import { SearchPageProps } from '@/types/pages';
import FileLayout from '@/layouts/file';
import { fileItem } from '@/types';
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
		<FileLayout user={session.user} activeTab='files' tabName={`Searched for: ${query}`}>
			<h4><b>Search for: {query}</b></h4>
			{files.map((_) => (
				filePanelToShow == _.id && <FilePanelPopup key={_.id} file={_} show={filePanelToShow == _.id} setShow={(s) => setFilePanelToShow(s)} />
			))}
			<FileViewTable files={files} setFilePanelToShow={setFilePanelToShow} showMoreDetail={true} />
		</FileLayout>
	);
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
	return { props: { query: context.query } };
}