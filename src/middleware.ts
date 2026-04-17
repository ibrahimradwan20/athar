import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );

          response = NextResponse.next();

          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // 🔥 استخدم getSession بدل getUser
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const protectedPaths = ["/dashboard", "/profile"];
  const authPaths = ["/auth/login", "/auth/register"];

  const pathname = request.nextUrl.pathname;

  const isProtected = protectedPaths.some((p) =>
    pathname.startsWith(p)
  );

  const isAuthPath = authPaths.some((p) =>
    pathname.startsWith(p)
  );

  // ❌ مش مسجل دخول ويحاول يدخل صفحة محمية
  if (isProtected && !session) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  // ✅ مسجل دخول ويحاول يدخل login/register
  if (isAuthPath && session) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};