import { UploadQueueProvider } from '@/components/Hooks/UploadContentManager';
import { FileProvider } from '@/components/Hooks/FileManager';
import 'bootstrap/dist/css/bootstrap.css';
import Header from '../components/header';
import type { AppProps } from 'next/app';
import { useEffect } from 'react';
import '@/styles/globals.scss';

export default function App({ Component, pageProps }: AppProps) {
	useEffect(() => {
		require('bootstrap/dist/js/bootstrap.bundle.min.js');
	}, []);

	return (
		<>
			<Header />
			<FileProvider>
				<UploadQueueProvider>
					<Component {...pageProps} />
				</UploadQueueProvider>
			</FileProvider>
		</>
	);
}
