import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verify } from 'jsonwebtoken';

// Interface for the decoded JWT token
interface DecodedToken {
  id: string;
  email: string;
  name: string;
  isAdmin: boolean | 'true' | 'false';
  iat: number;
  exp: number;
}

/**
 * Middleware function to check if the user is an admin
 * @param req - Next.js request object
 * @returns NextResponse object
 */
export async function isAdminMiddleware(req: NextRequest) {
  try {
    // Get the JWT token from cookies
    const token = req.cookies.get('auth_token')?.value;
    
    // If no token is found, redirect to login page
    if (!token) {
      return NextResponse.redirect(new URL('/login', req.url));
    }
    
    // Verify the token and decode it
    // Use a consistent secret key for development
    const JWT_SECRET = process.env.JWT_SECRET || 'next-tree-jwt-secret-2023';
    const decoded = verify(token, JWT_SECRET) as DecodedToken;
    
    // Check if the user is an admin
    // Handle both string and boolean representations of isAdmin
    const isAdmin = typeof decoded.isAdmin === 'boolean' 
      ? decoded.isAdmin 
      : decoded.isAdmin === 'true';
    
    if (!isAdmin) {
      // If not an admin, redirect to unauthorized page or home page
      return NextResponse.redirect(new URL('/', req.url));
    }
    
    // If the user is an admin, allow the request to proceed
    return NextResponse.next();
  } catch (error) {
    // If token verification fails, redirect to login page
    console.error('Admin authentication error:', error);
    return NextResponse.redirect(new URL('/login', req.url));
  }
}

/**
 * Higher-order function to create a route handler with admin authentication
 * @param handler - The original route handler function
 * @returns A new route handler with admin authentication
 */
export function withAdminAuth(handler: Function) {
  return async (req: NextRequest) => {
    try {
      console.log('withAdminAuth: Processing request for path:', req.nextUrl.pathname);
      
      // Get the JWT token from cookies
      const token = req.cookies.get('auth_token')?.value;
      console.log('withAdminAuth: Auth token exists:', !!token);
      
      // If no token is found, return unauthorized response
      if (!token) {
        console.log('withAdminAuth: No auth token found, returning 401');
        return NextResponse.json(
          { message: 'ไม่ได้รับอนุญาตให้เข้าถึง กรุณาเข้าสู่ระบบ' },
          { status: 401 }
        );
      }
      
      // Get the JWT secret from environment variable or use fallback
      const JWT_SECRET = process.env.JWT_SECRET || 'next-tree-jwt-secret-2023';
      console.log('withAdminAuth: Using JWT_SECRET:', JWT_SECRET ? 'Secret exists' : 'No secret found');
      
      try {
        // Verify the token and decode it
        console.log('withAdminAuth: Attempting to verify token');
        console.log('withAdminAuth: Token preview:', token.substring(0, 10) + '...');
        
        let decoded;
        try {
          decoded = verify(token, JWT_SECRET) as DecodedToken;
          console.log('withAdminAuth: Token verified successfully, decoded:', decoded);
        } catch (tokenError) {
          console.error('withAdminAuth: Token verification error:', tokenError);
          
          // Try with the old secret key as fallback (for backward compatibility)
          try {
            const OLD_JWT_SECRET = 'your-secret-key'; // Old fallback secret
            decoded = verify(token, OLD_JWT_SECRET) as DecodedToken;
            console.log('withAdminAuth: Token verified with old secret, decoded:', decoded);
          } catch (oldTokenError) {
            console.error('withAdminAuth: Old token verification also failed:', oldTokenError);
            return NextResponse.json(
              { message: 'โทเค็นไม่ถูกต้อง กรุณาเข้าสู่ระบบใหม่อีกครั้ง', error: 'Invalid token' },
              { status: 401 }
            );
          }
        }
        
        // Check if the user is an admin
        // Handle both string and boolean representations of isAdmin
        const isAdmin = typeof decoded.isAdmin === 'boolean' 
          ? decoded.isAdmin 
          : decoded.isAdmin === 'true';

        console.log('withAdminAuth: User isAdmin status:', isAdmin);
        
        if (!isAdmin) {
          // If not an admin, return forbidden response
          console.log('withAdminAuth: User is not an admin, returning 403');
          return NextResponse.json(
            { message: 'คุณไม่มีสิทธิ์เข้าถึงข้อมูลนี้' },
            { status: 403 }
          );
        }
        
        // If the user is an admin, call the original handler
        console.log('withAdminAuth: User is admin, proceeding to handler');
        return handler(req, decoded);
      } catch (verifyError) {
        console.error('withAdminAuth: Token verification failed:', verifyError);
        return NextResponse.json(
          { message: 'เกิดข้อผิดพลาดในการตรวจสอบสิทธิ์ กรุณาเข้าสู่ระบบใหม่อีกครั้ง', error: 'Authentication error' },
          { status: 401 }
        );
      }
    } catch (error) {
      console.error('Admin API authentication error:', error);
      // Add more detailed error information
      const errorMessage = error instanceof Error ? `${error.name}: ${error.message}` : 'Unknown error';
      console.error('Error details:', errorMessage);
      
      return NextResponse.json(
        { message: 'เกิดข้อผิดพลาดในการตรวจสอบสิทธิ์', error: errorMessage },
        { status: 401 }
      );
    }
  };
}
