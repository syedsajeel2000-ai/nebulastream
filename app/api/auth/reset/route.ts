import { NextResponse } from "next/server";
import { z } from "zod";
import { createPasswordReset, resetPasswordWithToken } from "@/lib/users";

export const runtime = "nodejs";

/**
 * Demo password-reset flow.
 * action=request  → generates a single-use token (returned directly — clearly
 *                   labelled demo since no mail provider is configured).
 * action=confirm  → exchanges token + new password for a changed hash.
 */
export async function POST(req: Request) {
  const url = new URL(req.url);
  const mode = url.searchParams.get("action") ?? "request";
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  try {
    if (mode === "request") {
      const { email } = z.object({ email: z.string().trim().email("Please enter a valid email address.") }).parse(body);
      const result = createPasswordReset(email);
      if (!result) {
        // Do not reveal whether the account exists (enumeration safety).
        return NextResponse.json({
          ok: true,
          demo: true,
          message: "If an account exists for this email, a reset token has been generated. Check the demo token display on the site.",
        });
      }
      return NextResponse.json({
        ok: true,
        demo: true,
        token: result.token,
        email: result.user.email,
        message: "DEMO RESET — no email provider is configured. Use the token below.",
      });
    }

    if (mode === "confirm") {
      const { token, password } = z
        .object({ token: z.string().min(10), password: z.string().min(8, "Password must be at least 8 characters.") })
        .parse(body);
      const res = resetPasswordWithToken(token, password);
      if (!res.ok) return NextResponse.json({ error: "This reset link is invalid or has expired." }, { status: 400 });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Unknown action." }, { status: 404 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "Check your input." }, { status: 400 });
    }
    console.error("[auth/reset]", error);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
