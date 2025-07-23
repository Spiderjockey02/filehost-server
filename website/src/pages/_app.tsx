import { UploadQueueProvider } from '@/components/Hooks/UploadContentManager';
import { FileProvider } from '@/components/Hooks/FileManager';
import { SocketProvider } from '@/components/Hooks/SocketManager';
import 'bootstrap/dist/css/bootstrap.css';
import Header from '../components/header';
import type { AppProps } from 'next/app';
import { useEffect } from 'react';
import '@/styles/globals.scss';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useRouter } from 'next/router';

const queryClient = new QueryClient();
export default function App({ Component, pageProps }: AppProps) {
	const router = useRouter();

	useEffect(() => {
		// eslint-disable-next-line @typescript-eslint/no-require-imports
		const bootstrap = require('bootstrap/dist/js/bootstrap.bundle.min.js');

		const handleRouteChange = () => {
			const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
			tooltipTriggerList.forEach((tooltipTriggerEl) => {
				new bootstrap.Tooltip(tooltipTriggerEl);
			});
		};

		// Run on initial load
		handleRouteChange();

		// Run after every route change
		router.events.on('routeChangeComplete', handleRouteChange);
		return () => {
			router.events.off('routeChangeComplete', handleRouteChange);
		};
	}, [router.events]);

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
