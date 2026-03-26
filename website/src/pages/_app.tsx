import { UploadQueueProvider } from '@/components/Hooks/UploadContentManager';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SocketProvider } from '@/components/Hooks/SocketManager';
import { ToastProvider } from '@/components/Hooks/ToastManager';
import { FileProvider } from '@/components/Hooks/FileManager';
import PopupToast from '@/components/UI/PopupToast';
import Header from '../components/header';
import type { AppProps } from 'next/app';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

import 'bootstrap/dist/css/bootstrap.css';
import '@/styles/globals.scss';

const queryClient = new QueryClient();
export default function App({ Component, pageProps }: AppProps) {
	const router = useRouter();

	useEffect(() => {
		require('bootstrap/dist/js/bootstrap.bundle.min.js');
	}, [router.events]);

	return (
		<>
			<Header />
			<QueryClientProvider client={queryClient}>
				<SocketProvider>
					<FileProvider>
						<UploadQueueProvider>
							<ToastProvider>
								<Component {...pageProps} />
								<PopupToast />
							</ToastProvider>
						</UploadQueueProvider>
					</FileProvider>
				</SocketProvider>
			</QueryClientProvider>
		</>
	);
}
