// middleware.js (for advanced CORS)
import { NextResponse } from 'next/server';

export function middleware(request) {
  const origin = request.headers.get('origin');
  const allowedOrigins = ['https://mimimi-gamer.vercel.app/', 'http://localhost:3000'];

  const isAllowedOrigin = origin && allowedOrigins.includes(origin);
  const response = NextResponse.next();

  if (isAllowedOrigin) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Credentials', 'true');
  }

  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        ...Object.fromEntries(response.headers),
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  return response;
}

export const config = {
  matcher: '/api/:path*',
};