/** @type {import('next').NextConfig} */
const nextConfig = {
	reactStrictMode: true,
	webpack5: true,
	webpack: (config) => {
		config.resolve.fallback = { fs: false };

		return config;
	},
	images: {
	 domains: ['mdbcdn.b-cdn.net'],
	},
};

module.exports = nextConfig;
