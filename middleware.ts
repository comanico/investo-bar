// import { clerkMiddleware } from '@clerk/nextjs/server'

// export default clerkMiddleware()

// export const config = {
//   matcher: [
//     // Skip Next.js internals and all static files, unless found in search params
//     '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
//     // Always run for API routes
//     '/(api|trpc)(.*)',
//   ],
// }

import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

// Define protected routes 
const isProtectedRoute = createRouteMatcher(['/dashboard(.*)']);

export default clerkMiddleware(async (auth, req) => {
  const { isAuthenticated, redirectToSignIn, userId } = await auth()
  // If the user is not authenticated and trying to access a protected route 
  if (!userId && isProtectedRoute(req)) {
    // Redirect to Clerk's sign-in page 
    return redirectToSignIn({ returnBackUrl: req.url });
  }

  // Allow the request to proceed if authenticated or not a protected route 
  return NextResponse.next();
});

export const config = {
  matcher: [
    // Allow unauthenticated access to the home page, hotel-details, and uploadthing API
    '/',
    '/chart',
    '/menu',
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}