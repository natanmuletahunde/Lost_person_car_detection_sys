import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const locales = ['en', 'am', 'om'];
const defaultLocale = 'en';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip static assets, file extensions, and api routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  const segments = pathname.split('/');
  const firstSegment = segments[1];

  let locale = defaultLocale;
  let cleanPath = pathname;

  // Detect path-based locale (e.g. /am/user/dashboard)
  if (locales.includes(firstSegment)) {
    locale = firstSegment;
    cleanPath = '/' + segments.slice(2).join('/');
  } else {
    // If no prefix, check cookie preference
    const cookieLocale = request.cookies.get('locale')?.value;
    if (cookieLocale && locales.includes(cookieLocale)) {
      locale = cookieLocale;
    }
  }

  // Rewrite request internally to clean unprefixed path matching original folder structure
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-locale', locale);

  const cleanUrl = new URL(cleanPath + request.nextUrl.search, request.url);
  const response = NextResponse.rewrite(cleanUrl, {
    request: {
      headers: requestHeaders,
    },
  });

  // Persist language cookie state
  response.cookies.set('locale', locale, { path: '/', maxAge: 31536000, sameSite: 'lax' });
  return response;
}

export const config = {
  // Match all paths except static assets
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
};
