/**
  * @type {import('next').NextConfig}
**/
const nextConfig = {
	reactStrictMode: true,
	webpack: (config) => {
		config.resolve.fallback = { fs: false };
		return config;
	},
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
	 ];
	},
};

module.exports = nextConfig;
