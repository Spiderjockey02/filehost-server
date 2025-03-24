import { Directory, PhotoAlbum, FileViewer, RecentNavbar, ErrorPopup } from '@/components';
import { useFile, useFileDispatch } from '@/components/fileManager';
import BreadcrumbNav from '@/components/Navbars/BreadcrumbNav';
import { FilePageProps, viewTypeTypes } from '@/types/pages';
import { useCallback, useEffect, useState } from 'react';
import type { GetServerSidePropsContext } from 'next';
import type { RecentlyViewed } from '../../types';
import { useTypedSession } from '@/auth-client';
import FileLayout from '@/layouts/file';
import axios from 'axios';

export default function Files({ path = '/' }: FilePageProps) {
	const { data: session } = useTypedSession();

	const [recents, setRecents] = useState<RecentlyViewed[]>([]);
	const [errorMsg, setErrorMsg] = useState('');
	const [viewType, setviewType] = useState<viewTypeTypes>('List');

	const file = useFile();
	const dispatch = useFileDispatch();

	const fetchFiles = useCallback(async () => {
		try {
			const { data } = await axios.get(`/api/files/${path}`);
			dispatch({ type: 'SET_FILE', payload: data.file });
		} catch (err) {
			setErrorMsg('Unable to fetch files');
			console.error('Error fetching files:', err);
		}
	}, [path, dispatch]);

	const fetchRecentlyViewedFiles = useCallback(async () => {
		try {
			const { data } = await axios.get('/api/session/recently-viewed');
			setRecents(data.files);
		} catch (err) {
			setErrorMsg('Unable to fetch recently viewed files');
		}
	}, []);

	useEffect(() => {
		fetchFiles();
		if (!path) fetchRecentlyViewedFiles();
	}, [path, fetchFiles, fetchRecentlyViewedFiles]);

	if (session == null || file == null) return null;
	return (
		<FileLayout user={session.user}>
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
		</FileLayout>
	);
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
	// Get path
	const path = [context.params?.files].flat();
	return { props: { path: path.join('/') } };
}
