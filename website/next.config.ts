import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
	reactStrictMode: true,
	webpack: (config) => {
		config.resolve = config.resolve || {};
		config.resolve.extensionAlias = {
			...(config.resolve.extensionAlias || {}),
			'.js': ['.js', '.ts'],
			'.mjs': ['.mjs', '.mts'],
		};
		config.resolve.fallback = { fs: false };
		return config;
	},
	experimental: {
		proxyClientMaxBodySize: '10gb',
	},
	images: {
		remotePatterns: [new URL('https://cdn.discordapp.com/**'), new URL('https://placehold.co/**') ],
	},
	allowedDevOrigins: ['192.168.0.170'],
	rewrites: async () => {
		return [
		 {
				source: '/avatar/:userId*',
				destination: `${process.env.BACKEND_URL}/avatar/:userId*`,
		 },
		 {
				source: '/thumbnail/:userId/:path*',
				destination: `${process.env.BACKEND_URL}/thumbnail/:userId/:path*`,
		 },
		 {
				source: '/content/:userId/:path*',
				destination: `${process.env.BACKEND_URL}/content/:userId/:path*`,
		 },
		 {
				source: '/api/auth/register',
				destination: `${process.env.BACKEND_URL}/api/auth/register`,
	 	 },
		 {
				source: '/api/:path((?!auth).*)',
				destination: `${process.env.BACKEND_URL}/api/:path*`,
		 },
		 {
				source: '/socket.io',
				destination: `${process.env.BACKEND_URL}/socket.io/`,
			},
	 ];
	},
};

export default nextConfig;