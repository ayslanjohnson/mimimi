// middleware.js
import { NextResponse } from 'next/server';

export function middleware(request) {
  // Define allowed origins dynamically
  const allowedOrigins = process.env.NODE_ENV === 'production'
    ? ['https://https://mimimi-gamer.vercel.app/']
    : ['http://localhost:3000', 'https://https://mimimi-gamer.vercel.app/'];

  const origin = request.headers.get('origin');
  const isAllowedOrigin = origin && allowedOrigins.includes(origin);

  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': isAllowedOrigin ? origin : allowedOrigins[0],
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  // Add CORS headers to actual responses
  const response = NextResponse.next();
  if (isAllowedOrigin) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Credentials', 'true');
  }
  return response;
}

// Apply middleware to API routes
export const config = {
  matcher: '/api/:path*',
};