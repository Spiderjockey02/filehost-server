export { default } from 'next-auth/middleware';

export const config = { matcher: ['/files/:path*', '/settings'] };
