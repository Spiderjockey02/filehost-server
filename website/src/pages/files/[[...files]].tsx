import { Directory, PhotoAlbum, FileViewer, RecentNavbar, ErrorPopup, BreadcrumbNav, UploadStatusToast } from '@/components';
import { useFolder, useFolderLoading } from '@/components/Hooks/FileManager';
import { FilePageProps, viewTypeTypes } from '@/types/pages';
import { useCallback, useEffect, useState } from 'react';
import { UserHistoryWithFile } from '@/types/database';
import type { GetServerSidePropsContext } from 'next';
import { authClient } from '@/auth/client';
import FileLayout from '@/layouts/file';
import { User } from 'better-auth';

export default function Files({ path = '/' }: FilePageProps) {
	const { data: session } = authClient.useSession();

	const [recents, setRecents] = useState<UserHistoryWithFile[]>([]);
	const [errorMsg, setErrorMsg] = useState('');
	const [viewType, setviewType] = useState<viewTypeTypes>('List');

	const file = useFolder();
	const { isLoading, error } = useFolderLoading();

	const fetchRecentlyViewedFiles = useCallback(async () => {
		try {
			const res = await fetch('/api/session/recently-viewed');
			const { files } = await res.json();
			setRecents(files);
		} catch (err) {
			console.log(err);
			setErrorMsg('Unable to fetch recently viewed files');
		}
	}, []);

	useEffect(() => {
		if (!path) fetchRecentlyViewedFiles();
	}, [path, fetchRecentlyViewedFiles]);

	if (session == null) return null;

	return (
		<FileLayout user={session.user as User} activeTab='files' tabName={file?.name}>
			<BreadcrumbNav path={path} isFile={file?.type == 'FILE'} setviewType={setviewType} viewType={viewType} parentId={`${file?.id}`} />
			{errorMsg && <ErrorPopup text={errorMsg} />}
			{(path.length == 0 && recents.length > 0) &&
				<RecentNavbar files={recents} />
			}
			<div style={{ paddingTop: '6px' }}>
				{error == null ?
					isLoading || file == null ?
						<p>Loading</p> :
						file.type === 'FILE' ? (
							<FileViewer file={file} userId={(session.user as User).id} />
						) : viewType === 'Tiles' ? (
							<PhotoAlbum folder={file} />
						) : (
							<Directory folder={file} />
						) :
					<div className="text-center text-danger fw-bold">
						{error?.message ?? 'Failed to load cache stats'}
					</div>
				}
			</div>
			<UploadStatusToast />
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
		// Get the path from the URL
		const path = [context.params?.files].flat();
		return { props: { path: path.join('/') } };
	}
}