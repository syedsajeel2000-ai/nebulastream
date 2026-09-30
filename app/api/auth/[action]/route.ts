import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { sessionCookieHeader } from "@/lib/session";
import { AuthError, loginUser, signupUser } from "@/lib/users";

export const runtime = "nodejs";

const SignupSchema = z.object({
  fullName: z.string().trim().min(2, "Please enter your full name.").max(80),
  username: z
    .string()
    .trim()
    .min(3, "Username must be at least 3 characters.")
    .max(30)
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers and underscores."),
  email: z.string().trim().email("Please enter a valid email address.").max(120),
  password: z.string().min(8, "Password must be at least 8 characters.").max(200),
  confirmPassword: z.string(),
}).refine((v) => v.password === v.confirmPassword, {
  message: "Passwords do not match.",
  path: ["confirmPassword"],
});

const LoginSchema = z.object({
  identifier: z.string().trim().min(1, "Please enter your email or username."),
  password: z.string().min(1, "Please enter your password."),
});

function friendly(error: unknown): string {
  if (error instanceof AuthError) return error.message;
  if (error instanceof z.ZodError) {
    return error.issues[0]?.message ?? "Please check your input.";
  }
  console.error("[auth]", error);
  return "Something went wrong on our end. Please try again.";
}

export async function POST(req: NextRequest) {
  const url = new URL(req.url);
  const action = url.pathname.endsWith("/signup") ? "signup" : "login";

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  try {
    if (action === "signup") {
      const data = SignupSchema.parse(body);
      const user = signupUser(data);
      return NextResponse.json(
        {
          ok: true,
          user: { id: user.id, fullName: user.full_name, username: user.username, email: user.email },
        },
        { headers: { "Set-Cookie": sessionCookieHeader(user.id, user.token_version) } }
      );
    }

    const data = LoginSchema.parse(body);
    const user = loginUser(data.identifier, data.password);
    return NextResponse.json(
      {
        ok: true,
        user: { id: user.id, fullName: user.full_name, username: user.username, email: user.email },
      },
      { headers: { "Set-Cookie": sessionCookieHeader(user.id, user.token_version) } }
    );
  } catch (error) {
    const status = error instanceof AuthError && error.code === "EMAIL_TAKEN" ? 409 : 400;
    return NextResponse.json({ error: friendly(error) }, { status });
  }
}
