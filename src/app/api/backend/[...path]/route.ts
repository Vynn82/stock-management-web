import { NextRequest, NextResponse } from "next/server";
import { apiClient } from "@/lib/api/client";

async function proxy(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  try {
    const response = await apiClient.request({
      url: `/${path.join("/")}`,
      method: request.method,
      data: request.method === "GET" ? undefined : await request.text(),
      headers: { Authorization: request.headers.get("authorization") || "" },
    });
    return NextResponse.json(response.data, { status: response.status });
  } catch {
    return NextResponse.json({ error: "Backend unavailable" }, { status: 502 });
  }
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
