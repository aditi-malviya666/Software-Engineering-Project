// src/app/api/analyse/route.ts
// Proxies /api/analyse → FastAPI backend on port 8000

import { NextRequest, NextResponse } from "next/server";

const FASTAPI_URL = process.env.FASTAPI_URL ?? "http://127.0.0.1:8000";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const res = await fetch(`${FASTAPI_URL}/api/v1/analyse`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(body),
    });

    const data = await res.json();

    // Forward FastAPI errors (422 Three-Test Rule, 503 model not loaded, etc.)
    if (!res.ok) {
      return NextResponse.json(data, { status: res.status });
    }

    return NextResponse.json(data, { status: 200 });

  } catch {
    return NextResponse.json(
      { error: "Could not reach the FastAPI backend. Is it running on port 8000?" },
      { status: 503 }
    );
  }
}