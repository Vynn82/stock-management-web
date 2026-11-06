import { NextRequest, NextResponse } from "next/server";

/**
 * Same-origin proxy: the browser only ever talks to this site
 * (https://stock.theavin.xyz/api/backend/...). The backend address lives in a
 * server-side variable, so it never reaches the browser, there is no CORS and
 * an https site can safely reach an http backend.
 */
const backendBase = (process.env.BACKEND_URL || "https://stock.theavin.xyz").replace(/\/+$/, "");

export const dynamic = "force-dynamic";
export const maxDuration = 30; // seconds (Vercel)

const NO_BODY = new Set([204, 205, 304]);

async function proxy(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  const url = `${backendBase}/${path.join("/")}${request.nextUrl.search}`;

  const headers = new Headers();
  const authorization = request.headers.get("authorization");
  if (authorization) headers.set("Authorization", authorization);
  const contentType = request.headers.get("content-type");
  if (contentType) headers.set("Content-Type", contentType); // keeps the multipart boundary

  const hasBody = request.method !== "GET" && request.method !== "HEAD";

  try {
    const res = await fetch(url, {
      method: request.method,
      headers,
      body: hasBody ? await request.arrayBuffer() : undefined,
      cache: "no-store",
      signal: AbortSignal.timeout(25_000),
    });

    // Pass the answer through untouched: JSON, errors and files (Excel exports) alike.
    const out = new Headers();
    for (const name of ["content-type", "content-disposition"]) {
      const value = res.headers.get(name);
      if (value) out.set(name, value);
    }
    return new NextResponse(NO_BODY.has(res.status) ? null : await res.arrayBuffer(), { status: res.status, headers: out });
  } catch {
    return NextResponse.json({ error: "Backend unavailable" }, { status: 502 });
  }
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
