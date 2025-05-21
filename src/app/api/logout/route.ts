import { NextResponse } from "next/server";

export async function GET() {
  const response = NextResponse.json({ message: "Logged out" });
  

  // Clear cookies
  response.cookies.set("token", "", { path: "/", expires: new Date(0) });
  response.cookies.set("role", "", { path: "/", expires: new Date(0) });
  response.cookies.set("user_email", "", { path: "/", expires: new Date(0) });
  console.log("Logout response: ", response);


  return response;
}
