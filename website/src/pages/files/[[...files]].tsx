import { Directory, PhotoAlbum, FileViewer, RecentNavbar, ErrorPopup, BreadcrumbNav, UploadStatusToast } from '@/components';
import { useFolder, useSetFolder } from '@/components/Hooks/FileManager';
import { FilePageProps, viewTypeTypes } from '@/types/pages';
import { useCallback, useEffect, useState } from 'react';
import type { GetServerSidePropsContext } from 'next';
import { authClient } from '@/auth/client';
import FileLayout from '@/layouts/file';
import axios from 'axios';
import { User } from 'better-auth';
import { UserHistoryWithFile } from '@/types/database';
import { auth } from '@/auth/server';

export default function Files({ path = '/' }: FilePageProps) {
	const { data: session } = authClient.useSession();

	const [recents, setRecents] = useState<UserHistoryWithFile[]>([]);
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
		<FileLayout user={session.user as User} activeTab='files' tabName={file.name}>
			<BreadcrumbNav path={path} isFile={file.type == 'FILE'} setviewType={setviewType} viewType={viewType} parentId={file.id} />
			{errorMsg && <ErrorPopup text={errorMsg} onClose={() => setErrorMsg('')} />}
			{(path.length == 0 && recents.length > 0) &&
				<RecentNavbar files={recents} />
			}
			<div style={{ paddingTop: '6px' }}>
				{file.type === 'FILE' ? (
					<FileViewer file={file} userId={(session.user as User).id} />
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
	const session = await auth.api.getSession({
		headers: new Headers({
			cookie: context.req.headers.cookie || '',
		}),
	});

	// Only show this page if they are logged in
	if (session == null) {
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