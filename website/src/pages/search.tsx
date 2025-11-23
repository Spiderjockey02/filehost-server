import { queryOptions, useQuery } from '@tanstack/react-query';
import type { GetServerSidePropsContext } from 'next/types';
import { useToast } from '@/components/Hooks/ToastManager';
import type { FileWithCount } from '@/types/database';
import type { SearchPageProps } from '@/types/pages';
import { FileViewTable } from '@/components';
import { authClient } from '@/auth/client';
import FileLayout from '@/layouts/file';
import type { User } from 'better-auth';
import { useEffect } from 'react';

export default function Search({ query: { query, fileType, dateUpdated } }: SearchPageProps) {
	const { data: session } = authClient.useSession();
	const { showToast } = useToast();

	const { data, isLoading, error } = useQuery({
		queryKey: ['recent', query, fileType, dateUpdated],
		queryFn: async ({ signal }) => {
			const res = await fetch(`/api/files/search?query=${query}&fileType=${fileType}&updatedSince=${dateUpdated}`, { signal });
			if (!res.ok) throw new Error(`Failed to search for files: ${res.statusText}`);

			const d = await res.json();
			return d as { files: FileWithCount[] };
		},
		...queryOptions,
	});

	useEffect(() => {
		if (error) showToast('error', error.message);
	}, [error]);

	if (session == null) return null;
	return (
		<FileLayout user={session.user as User} activeTab='files' tabName={`Searched for: ${query}`}>
			<h4><b>Search for: {query}</b></h4>
			{isLoading || data == null ?
				<p>Loading</p> :
				<FileViewTable files={data.files} showMoreDetail={true} setFilePanelToShow={() => null} />
			}
		</FileLayout>
	);
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
	const res = await fetch(`${process.env.BETTER_AUTH_URL}/api/auth/get-session`, {
		headers: {
			cookie: context.req.headers.cookie || '',
		},
	});

	const data = await res.json();
	if (data == null) {
		return {
			redirect: {
				destination: '/login',
				permanent: false,
			},
		};
	} else {
		return { props: { query: context.query } };
	}
}