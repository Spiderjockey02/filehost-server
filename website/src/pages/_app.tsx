import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import { SessionProvider } from 'next-auth/react';
import 'bootstrap/dist/css/bootstrap.css';
import { useEffect } from 'react';
import Script from 'next/script';
import Header from '../components/header';
import 'bootstrap-icons/font/bootstrap-icons.css';

export default function App({ Component, pageProps: { session, ...pageProps } }: AppProps) {
	useEffect(() => {
		require('bootstrap/dist/js/bootstrap.bundle.min.js');
	}, []);

	return (
		<SessionProvider session={session}>
			<Script src="/fontawesome.js" />
			<Header />
			<Component {...pageProps} />
		</SessionProvider>
	);
}
