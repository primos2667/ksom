import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

// 👉 PUT YOUR REAL ADMIN EMAIL HERE - ONLY YOU CAN ENTER ADMIN
const ADMIN_EMAILS = [
  "primos7662@gmail.com", // <--- CHANGE THIS TO YOUR REAL EMAIL
];

export async function middleware(req: NextRequest) {
  let res = NextResponse.next({
    request: { headers: req.headers },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return req.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => req.cookies.set(name, value));
          res = NextResponse.next({ request: { headers: req.headers } });
          cookiesToSet.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  // Protect /admin
  if (req.nextUrl.pathname.startsWith("/admin-2kzla-pr1mos-2026-pr1ma")) {
    if (!user) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    if (!ADMIN_EMAILS.includes(user.email || "")) {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  return res;
}

export const config = {
  matcher: ["/admin-2kzla-pr1mos-2026-pr1ma/:path*"],
};