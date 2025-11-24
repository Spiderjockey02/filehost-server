import type { GetServerSidePropsContext } from 'next';
import type { File } from '@/types/generated/browser';
import { useQuery } from '@tanstack/react-query';
import { queryOptions } from '@/utils/functions';
import Gallery from '@/components/views/Gallery';
import { authClient } from '@/auth/client';
import FileLayout from '@/layouts/file';
import type { User } from 'better-auth';

export default function GalleryPage() {
	const { data: session } = authClient.useSession();

	const { data } = useQuery({
		queryKey: ['gallery', session?.user?.id],
		queryFn: async ({ signal }) => {
			const res = await fetch('/api/session/gallery', { signal });
			if (!res.ok) throw new Error(`Failed to fetch user's gallery: ${res.statusText}`);

			const d = await res.json();
			return d as { files: File[] };
		},
		...queryOptions,
	});

	if (session == null) return null;
	return (
		<FileLayout user={session.user as User} activeTab='gallery' tabName="Gallery">
			<Gallery files={data?.files ?? []} />
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
		return { props: { } };
	}
}