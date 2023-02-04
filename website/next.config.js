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
	rewrites: async () => {
		return [
		 {
				source: '/avatar/:id',
				destination: 'http://localhost:9816/avatar/:id',
		 },
		 {
				source: '/thumbnail/:id',
				destination: 'http://localhost:9816/thumbnail/:id/:path',
		 },
	 ];
	},
	experimental: {
		largePageDataBytes: 128 * 100000,
	},
};

module.exports = nextConfig;
