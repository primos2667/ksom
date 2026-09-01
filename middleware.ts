import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Simple middleware - no Supabase package needed!
// Admin protection is done inside app/admin/page.tsx (client side)
// This just allows all requests to pass, fixing the red underline error

export async function middleware(req: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
