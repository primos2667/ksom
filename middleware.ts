import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Simple middleware - admin check done in admin page via env var
export async function middleware(req: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
