import Head from 'next/head';
import config from '../config';

export default function Header() {
	return (
		<Head>
			<meta charSet="utf-8" />
			<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
			<meta name="description" content={`Save your files to ${config.company.name} and access them from any device, anywhere. Learn more and get 5 GB of free cloud storage today.`} />
			<meta name="theme-color" content="#106eea"/>
			<meta property="og:type" content="website" />
			<meta property="og:title" content={config.company.name} />
			<meta property="og:description" content={`Save your files to ${config.company.name} and access them from any device, anywhere. Learn more and get 5 GB of free cloud storage today.`} />
			<title>File Sharer</title>
		</Head>
	);
}
