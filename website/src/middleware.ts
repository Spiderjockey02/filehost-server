import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function middleware(request: NextRequest) {
	// Fetch user session from the server
	const { data } = await axios.get(`${request.nextUrl.origin}/api/auth/get-session`, {
		headers: {
			cookie: request.headers.get('cookie') || '',
		},
	});

	// Check to see if the user is logged in
	if (data.user) {
		if (request.nextUrl.pathname.startsWith('/admin')) {
			if (data.user.role !== 'admin') {
				return NextResponse.redirect(new URL('/', request.url));
			}
		}
		return NextResponse.next();
	} else {
		return NextResponse.redirect(new URL('/', request.url));
	}
}

export const config = {
	matcher: ['/files/:path*', '/settings', '/trash', '/search', '/recent', '/admin/:path*'],
};