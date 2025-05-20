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
  const secretKey = process.env.NEXT_PUBLIC_SECRET_KEY_USER;
  if (!secretKey) {
    throw new Error("SECRET_KEY environment variable is not set");
  }
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    Buffer.from(secretKey),
    iv
  );
  let decrypted = decipher.update(encrypted, "hex", "utf-8");
  console.log(decrypted);
  decrypted += decipher.final("utf-8");
  return decrypted;
}

export async function POST(req: Request) {
  const { email, password } = await req.json();
  const client = await clientPromise;
  const db = client.db("logger-db");
  const collection = db.collection("users");

  const user = await collection.findOne({ email });

  if (!user) {
    return NextResponse.json({ message: "User not found" }, { status: 404 });
  }

  const encryptedPassword = user.password;
  console.log("Encrypted Password: ", encryptedPassword);
  const decryptPasswordUser = decryptPassword(encryptedPassword);

  if (decryptPasswordUser !== password) {
    return NextResponse.json(
      { message: "Invalid credentials" },
      { status: 401 }
    );
  }

  // ✅ Generate JWT
  const token = jwt.sign(
    { email: user.email, name: user.name }, // you can include more if needed
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
      maxAge: 60 * 60, // 1 hour
    })
  );

  return response;
}
