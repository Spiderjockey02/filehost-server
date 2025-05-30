import { NextRequest, NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
	// Fetch user session from the server
	try {
		const res = await fetch(`${request.nextUrl.origin}/api/auth/get-session`, {
			headers: {
				cookie: request.headers.get('cookie') || '',
			},
		});

		const data = await res.json();

		// Check to see if the user is logged in
		if (data?.user) {
			if (request.nextUrl.pathname.startsWith('/admin')) {
				if (data.user.role !== 'admin') {
					return NextResponse.redirect(new URL('/', request.url));
				}
			}
			return NextResponse.next();
		} else {
			return NextResponse.redirect(new URL('/', request.url));
		}
	} catch (err) {
		console.log(err);
		return NextResponse.redirect(new URL('/', request.url));
	}
}

export const config = {
	matcher: ['/files/:path*', '/settings', '/trash', '/search', '/recent', '/admin/:path*', '/notifications'],
};