/**
  * @type {import('next').NextConfig}
**/
const nextConfig = {
	reactStrictMode: true,
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
				source: '/avatar/:userId*',
				destination: 'http://localhost:9816/avatar/:userId*',
		 },
		 {
				source: '/thumbnail/:userId/:path*',
				destination: 'http://localhost:9816/thumbnail/:userId/:path*',
		 },
		 {
				source: '/content/:userId/:path*',
				destination: 'http://localhost:9816/content/:userId/:path*',
		 },
		 {
				source: '/api/:path((?!auth).*)',
				destination: 'http://localhost:9816/api/:path*',
		 },
	 ];
	},
	experimental: {
		largePageDataBytes: 128 * 100000,
	},
};

module.exports = nextConfig;
