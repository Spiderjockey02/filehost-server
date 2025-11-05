import type { GetServerSidePropsContext } from 'next';
import { authClient } from '@/auth/client';
import FileLayout from '@/layouts/file';
import { User } from 'better-auth';
import { useQuery } from '@tanstack/react-query';
import { queryOptions } from '@/utils/functions';
import { File } from '@prisma/client';
import Gallery from '@/components/views/Gallery';

export default function GalleryPage() {
	const { data: session } = authClient.useSession();

	const { data } = useQuery({
		queryKey: ['gallery', session?.user?.id],
		queryFn: async ({ signal }) => {
			const res = await fetch('/api/gallery', { signal });
			if (!res.ok) throw new Error(`Failed to fetch audit log listeners: ${res.statusText}`);

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