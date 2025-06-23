import { UploadQueueProvider } from '@/components/Hooks/UploadContentManager';
import { FileProvider } from '@/components/Hooks/FileManager';
import { SocketProvider } from '@/components/Hooks/SocketManager';
import 'bootstrap/dist/css/bootstrap.css';
import Header from '../components/header';
import type { AppProps } from 'next/app';
import { useEffect } from 'react';
import '@/styles/globals.scss';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();
export default function App({ Component, pageProps }: AppProps) {
	useEffect(() => {
		// eslint-disable-next-line @typescript-eslint/no-require-imports
		require('bootstrap/dist/js/bootstrap.bundle.min.js');
	}, []);

	return (
		<>
			<Header />
			<QueryClientProvider client={queryClient}>
				<SocketProvider>
					<FileProvider>
						<UploadQueueProvider>
							<Component {...pageProps} />
						</UploadQueueProvider>
					</FileProvider>
				</SocketProvider>
			</QueryClientProvider>
		</>
	);
}
