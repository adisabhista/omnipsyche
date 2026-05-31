import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export default auth((req) => {
    const isLoggedIn = Boolean(req.auth?.user);
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
});

export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
