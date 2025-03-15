import '@/styles/globals.scss';
import type { AppProps } from 'next/app';
import 'bootstrap/dist/css/bootstrap.css';
import { useEffect } from 'react';
import Header from '../components/header';
import { FileProvider } from '@/components/fileManager';

export default function App({ Component, pageProps }: AppProps) {
	useEffect(() => {
		require('bootstrap/dist/js/bootstrap.bundle.min.js');
	}, []);

	return (
		<>
			<Header />
			<FileProvider>
				<Component {...pageProps} />
			</FileProvider>
		</>
	);
}
