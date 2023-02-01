import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import { SessionProvider } from 'next-auth/react';
import 'bootstrap/dist/css/bootstrap.css';
import { useEffect } from 'react';
import Script from 'next/script';

export default function App({ Component, pageProps: { session, ...pageProps } }: AppProps) {
	useEffect(() => {
		require('bootstrap/dist/js/bootstrap.bundle.min.js');
	}, []);

	return (
		<SessionProvider session={session}>
			<Script src="https://kit.fontawesome.com/fa3685e359.js" />
			<Component {...pageProps} />
		</SessionProvider>
	);
}
