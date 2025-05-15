import { Directory, PhotoAlbum, FileViewer, RecentNavbar, ErrorPopup, BreadcrumbNav, UploadStatusToast } from '@/components';
import { useFolder, useSetFolder } from '@/components/Hooks/FileManager';
import { FilePageProps, viewTypeTypes } from '@/types/pages';
import { useCallback, useEffect, useState } from 'react';
import type { GetServerSidePropsContext } from 'next';
import type { RecentlyViewed } from '../../types';
import { authClient } from '@/auth/client';
import FileLayout from '@/layouts/file';
import { auth } from '@/auth/server';
import axios from 'axios';

export default function Files({ path = '/' }: FilePageProps) {
	const { data: session } = authClient.useSession();

	const [recents, setRecents] = useState<RecentlyViewed[]>([]);
	const [errorMsg, setErrorMsg] = useState('');
	const [viewType, setviewType] = useState<viewTypeTypes>('List');

	const file = useFolder();
	const setFolder = useSetFolder();

	const fetchFiles = useCallback(async () => {
		try {
			const { data } = await axios.get(`/api/files/${path}`);
			setFolder(data.file);
		} catch (err) {
			setErrorMsg('Unable to fetch files');
			console.error('Error fetching files:', err);
		}
	}, [path, setFolder]);

	const fetchRecentlyViewedFiles = useCallback(async () => {
		try {
			const { data } = await axios.get('/api/session/recently-viewed');
			setRecents(data.files);
		} catch (err) {
			console.log(err);
			setErrorMsg('Unable to fetch recently viewed files');
		}
	}, []);

	useEffect(() => {
		fetchFiles();
		if (!path) fetchRecentlyViewedFiles();
	}, [path, fetchFiles, fetchRecentlyViewedFiles]);

	if (session == null || file == null) return null;
	return (
		<FileLayout user={session.user} activeTab='files'>
			<BreadcrumbNav path={path} isFile={file.type == 'FILE'} setviewType={setviewType} viewType={viewType} parentId={file.id} />
			{errorMsg && <ErrorPopup text={errorMsg} onClose={() => setErrorMsg('')} />}
			{(path.length == 0 && recents.length > 0) &&
				<RecentNavbar files={recents} />
			}
			<div style={{ paddingTop: '6px' }}>
				{file.type === 'FILE' ? (
					<FileViewer file={file} userId={session.user.id} />
				) : viewType === 'Tiles' ? (
					<PhotoAlbum folder={file} />
				) : (
					<Directory folder={file} />
				)
				}
			</div>
			<UploadStatusToast />
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

	// Get the path from the URL
	const path = [context.params?.files].flat();
	return { props: { path: path.join('/') } };
}
