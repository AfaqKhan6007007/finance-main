import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server';

const isPublicRoute = createRouteMatcher([
  '/login(.*)',
  '/signup(.*)',
  '/api/webhooks(.*)',
  '/api(.*)',
  '/api/auth/signup',
])

const isAuthPage = createRouteMatcher([
  '/login(.*)',
  '/signup(.*)',
]);


export default clerkMiddleware(async (auth, req) => {

  const { userId } = await auth();

  if (!isPublicRoute(req)) {
    await auth.protect()
  }

  // If user is logged in and tries to access login/signup → redirect
  if (userId && isAuthPage(req)) {
    return NextResponse.redirect(new URL('/', req.url)); // redirect to homepage (change if needed)
  }
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}