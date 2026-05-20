import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

const authSecret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;

export default async function middleware(req: NextRequest) {
    const token = authSecret
        ? await getToken({
              req,
              secret: authSecret,
          })
        : null;
    const isLoggedIn = Boolean(token);
    const { pathname } = req.nextUrl;
    const isAuthPage = pathname === "/login" || pathname === "/register";

    if (!isLoggedIn && !isAuthPage) {
        const loginUrl = new URL("/login", req.nextUrl.origin);
        return NextResponse.redirect(loginUrl);
    }

    if (isLoggedIn && isAuthPage) {
        return NextResponse.redirect(new URL("/", req.nextUrl.origin));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
