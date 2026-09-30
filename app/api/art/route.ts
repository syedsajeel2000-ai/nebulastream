import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const ALLOWED_HOSTS = new Set(["picsum.photos", "fastly.picsum.photos", "images.pexels.com", "commondatastorage.googleapis.com"]);
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125 Safari/537.36";

function fallbackPng(): ArrayBuffer {
  const buf = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk2D6vEQAA4gFx/p3P3gAAAABJRU5ErkJggg==",
    "base64"
  );
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;
}

export async function GET(req: NextRequest) {
  const remote = req.nextUrl.searchParams.get("url");
  if (!remote) return new NextResponse("Missing url", { status: 400 });

  let parsed: URL;
  try {
    parsed = new URL(remote);
  } catch {
    return new NextResponse("Bad url", { status: 400 });
  }
  if (!/^https?:$/.test(parsed.protocol) || !ALLOWED_HOSTS.has(parsed.hostname)) {
    return new NextResponse("Host not allowed", { status: 403 });
  }

  try {
    const upstream = await fetch(parsed.toString(), {
      headers: { "User-Agent": UA, Accept: "image/*" },
      signal: AbortSignal.timeout(8000),
      redirect: "follow",
    });
    if (!upstream.ok) throw new Error(String(upstream.status));
    const type = upstream.headers.get("content-type") ?? "image/jpeg";
    if (!type.startsWith("image/")) throw new Error("not an image");
    const ab = await upstream.arrayBuffer();
    return new NextResponse(ab, {
      headers: {
        "Content-Type": type,
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
      },
    });
  } catch {
    // Graceful degradation: 1x1 dark pixel instead of a broken image.
    return new NextResponse(fallbackPng(), {
      headers: { "Content-Type": "image/png", "Cache-Control": "no-store" },
    });
  }
}
