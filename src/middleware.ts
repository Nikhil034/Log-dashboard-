// middleware.ts
import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

export async function middleware(req: NextRequest) {
  console.log("Middleware triggered for URL:", req.url);
  console.log("Cookies:", req.cookies.getAll());
  const token = req.cookies.get("auth-token")?.value;
  console.log("Token:", token);

  if (!token) {
    console.log("No token found, redirecting to login");
    return NextResponse.redirect(new URL("/userlogin", req.url));
  }

  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(process.env.JWT_SECRET)
    );
    if (payload.name === "lampros-root") {
      console.log("Root user detected, allowing access");
      const res = NextResponse.next();
      res.cookies.set("role", "root", { path: "/" });
      return res;
    }
    if (payload.email) {
      console.log("User email detected, allowing access");
      const res = NextResponse.next();
      res.cookies.set("user_email", String(payload.email), {
        path: "/", 
        httpOnly: false, 
        secure: true, 
        sameSite: "lax",
      });
      return res;
    }

    console.log("JWT Payload:", payload);
  } catch (error) {
    console.error("JWT verification failed:", error);
    return NextResponse.redirect(new URL("/userlogin", req.url));
  }
}

export const config = {
  matcher: ["/", "/admin/:grant-access"],
};
