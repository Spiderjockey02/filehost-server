import { useToast } from '@/components/Hooks/ToastManager';
import type { GetServerSidePropsContext } from 'next';
import { useQuery } from '@tanstack/react-query';
import { queryOptions } from '@/utils/functions';
import Gallery from '@/components/views/Gallery';
import type { PageProps } from '@/types/pages';
import FileLayout from '@/layouts/file';
import { useEffect } from 'react';
import API from '@/services/api';

export default function GalleryPage({ user }: PageProps) {
	const { showToast } = useToast();

	const { data, isLoading, error } = useQuery({
		queryKey: ['gallery'],
		queryFn: async ({ signal }) => API.SESSION.fetchGallery(signal),
		...queryOptions,
	});

	useEffect(() => {
		if (error) showToast('error', error.message);
	}, [error]);

	return (
		<FileLayout user={user} activeTab='gallery' tabName="Gallery">
			<Gallery files={data?.files ?? []} isLoading={isLoading || error !== null} />
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
		return { props: { user: data.user } };
	}
}