import { Directory, PhotoAlbum, FileViewer, RecentNavbar, BreadcrumbNav, UploadStatusToast } from '@/components';
import type { FilePageProps, viewTypeTypes } from '@/types/pages';
import useManageFolder from '@/components/Hooks/FileManager';
import { useToast } from '@/components/Hooks/ToastManager';
import FileMetadata from '@/components/views/FileMetadata';
import type { GetServerSidePropsContext } from 'next';
import type { Session } from '@/auth/server';
import { useEffect, useState } from 'react';
import { authClient } from '@/auth/client';
import FileLayout from '@/layouts/file';
import API from '@/services/api';

export default function Files({ path = '/' }: FilePageProps) {
	const [viewType, setviewType] = useState<viewTypeTypes>('List');
	const { file, error, isLoading } = useManageFolder();
	const { data: session } = authClient.useSession();
	const { showToast } = useToast();

	useEffect(() => {
		if (error) showToast('error', error.message);
	}, [error]);

	if (session == null) return null;
	return (
		<FileLayout user={session.user as Session['user']} activeTab='files' tabName={file?.name}>
			<BreadcrumbNav path={path} isFile={file?.type == 'FILE'} setviewType={setviewType} viewType={viewType} parentId={`${file?.id}`} />
			{(path == '/' && file?.children.length !== 0) && <RecentNavbar />}
			<div style={{ paddingTop: '6px' }}>
				{isLoading || file == null ?
					<p>Loading</p> :
					file.type === 'FILE' ?
						<>
							<FileViewer file={file} userId={session.user!.id} />
							<FileMetadata file={file} />
						</>
					  : viewType === 'Tiles' ?
							<PhotoAlbum folder={file} />
					 		: <Directory folder={file} />
				}
			</div>
			<UploadStatusToast />
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
		// Get the path from the URL
		const path = context.params?.files;
		return { props: { path: path == undefined ? '/' : Array.isArray(path) ? path.join('/') : path } };
	}
}