import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseConfig } from "./config";

const PUBLIC_PATH_PREFIXES = ["/login", "/auth"];

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  // If Supabase isn't configured, don't hard-500 every route from the proxy —
  // let the request through and let the page/layout handle auth. This keeps a
  // misconfiguration from taking down the whole app opaquely.
  let url: string;
  let publishableKey: string;
  try {
    ({ url, publishableKey } = getSupabaseConfig());
  } catch (err) {
    console.error("[proxy] Supabase not configured:", err);
    return response;
  }

  const supabase = createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      // @supabase/ssr calls setAll with a single argument (the cookies to set).
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  let hasSession = false;
  try {
    const { data } = await supabase.auth.getClaims();
    hasSession = Boolean(data?.claims);
  } catch (err) {
    // A transient auth/network error shouldn't 500 the entire site.
    console.error("[proxy] getClaims failed:", err);
    return response;
  }

  const path = request.nextUrl.pathname;
  const isPublicPath = PUBLIC_PATH_PREFIXES.some((p) => path.startsWith(p));
  const isApiPath = path.startsWith("/api");

  if (!hasSession && !isPublicPath && !isApiPath) {
    const redirectTo = request.nextUrl.clone();
    redirectTo.pathname = "/login";
    redirectTo.searchParams.set("next", path);
    return NextResponse.redirect(redirectTo);
  }

  return response;
}
