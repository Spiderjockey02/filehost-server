const config = {
	port: 9816,
	useGPU: true,
	frontendURL: 'THE URL OF THE MAIN WEBSITE',
	NEXTAUTH_SECRET: 'SAME SECRET AS FRONT END WEBSITE',
	// 10 GB
	maximumFileSize:  1024 * 1024 * 1024 * 10,
};

export default config;
