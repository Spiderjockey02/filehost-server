import { queryOptions, useQuery } from '@tanstack/react-query';
import type { GetServerSidePropsContext } from 'next/types';
import { useToast } from '@/components/Hooks/ToastManager';
import type { SearchPageProps } from '@/types/pages';
import { FileViewTable } from '@/components';
import FileLayout from '@/layouts/file';
import { useEffect } from 'react';
import API from '@/services/api';

export default function Search({ query: { query, fileType, dateUpdated }, user }: SearchPageProps) {
	const { showToast } = useToast();

	const { data, isLoading, error } = useQuery({
		queryKey: ['recent', query, fileType, dateUpdated],
		queryFn: async ({ signal }) => {
			return await API.FILE.search(signal, query, fileType, dateUpdated);
		},
		...queryOptions,
	});

	useEffect(() => {
		if (error) showToast('error', error.message);
	}, [error]);

	return (
		<FileLayout user={user} activeTab='files' tabName={`Searched for: ${query}`}>
			<h4><b>Search for: {query}</b></h4>
			{isLoading || data == null ?
				<p>Loading</p> :
				<FileViewTable files={data.files} showMoreDetail={true} setFilePanelToShow={() => null} />
			}
		</FileLayout>
	);
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
	const data = await API.SESSION.fetchCurrentSession(context.req.headers.cookie || '');
	if (data == null) {
		return {
			redirect: {
				destination: '/login',
				permanent: false,
			},
		};
	} else {
		return { props: { query: context.query, user: data.user } };
	}
}