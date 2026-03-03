import { NextRequest, NextResponse } from 'next/server';
import API from './services/api';

export async function proxy(request: NextRequest) {
	// Fetch user session from the server
	try {
		const data = await API.SESSION.fetchCurrentSession(request.headers.get('cookie') || '');

		// Check to see if the user is logged in
		if (data?.user) {
			if (request.nextUrl.pathname.startsWith('/admin')) {
				if (data.user.role !== 'admin') return NextResponse.redirect(new URL('/', request.url));
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