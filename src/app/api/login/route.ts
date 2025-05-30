import clientPromise from "@/app/lib/mongodb";
import { NextResponse } from "next/server";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { serialize } from "cookie";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is not set");
}


function decryptPassword(encryptedData: string) {
  const ALGORITHM = "aes-256-cbc";
  const [ivHex, encrypted] = encryptedData.split(":");
  const iv = Buffer.from(ivHex, "hex");
  const secretKey = process.env.SECRET_KEY_ROOT;
  if (!secretKey) {
    throw new Error("SECRET_KEY environment variable is not set");
  }
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    Buffer.from(secretKey),
    iv
  );
  let decrypted = decipher.update(encrypted, "hex", "utf-8");
  decrypted += decipher.final("utf-8");
  return decrypted;
}

export async function POST(req: Request) {
  const { username, password } = await req.json();
  const client = await clientPromise;
  const db = client.db("logger-db");
  const collection = db.collection("root_admin");

  const user = await collection.findOne({ username });

  if (!user) {
    return NextResponse.json({ message: "User not found" }, { status: 404 });
  }

  const decryptedPassword = decryptPassword(user.password);

  if (password !== decryptedPassword) {
    return NextResponse.json(
      { message: "Invalid credentials" },
      { status: 401 }
    );
  }

  // return NextResponse.json({ message: "Login successful"},{status: 200} );

    const token = jwt.sign(
      { name: user.username }, // you can include more if needed
      JWT_SECRET as string,
      { expiresIn: "1h" }
    );
  
    console.log("JWT Token: ", token);
  
    // ✅ Set cookie
    const response = NextResponse.json(
      { message: "Login successful" },
      { status: 200 }
    );
  
    response.headers.set(
      "Set-Cookie",
      serialize("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 2 * 60 * 60 + 30 * 60, // 2 hours 30 minutes = 9000 seconds
      })
    );
  
    return response;
}
