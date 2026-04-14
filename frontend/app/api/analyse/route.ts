// // src/app/api/analyse/route.ts
// // Proxies /api/analyse → FastAPI backend on port 8000

// import { NextRequest, NextResponse } from "next/server";

// const FASTAPI_URL = process.env.FASTAPI_URL ?? "http://127.0.0.1:8000";

// export async function POST(req: NextRequest) {
//   try {
//     const body = await req.json();

//     const res = await fetch(`${FASTAPI_URL}/api/v1/analyse`, {
//       method:  "POST",
//       headers: { "Content-Type": "application/json" },
//       body:    JSON.stringify(body),
//     });

//     const data = await res.json();

//     // Forward FastAPI errors (422 Three-Test Rule, 503 model not loaded, etc.)
//     if (!res.ok) {
//       return NextResponse.json(data, { status: res.status });
//     }

//     return NextResponse.json(data, { status: 200 });

//   } catch {
//     return NextResponse.json(
//       { error: "Could not reach the FastAPI backend. Is it running on port 8000?" },
//       { status: 503 }
//     );
//   }
// }   import { NextResponse } from "next/server";
import { NextResponse } from "next/server";
import { db } from "@/db"; 
import { results } from "@/db/schema/results";
import { eq, desc } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { sessionId } = body;

    if (!sessionId) {
      return NextResponse.json(
        { error: "sessionId is required" },
        { status: 400 }
      );
    }

    /*
      STEP 1 — Get data from PostgreSQL
      (Model 1 output)
    */

    const sessionResults = await db
      .select()
      .from(results)
      .where(eq(results.sessionId, sessionId));

    if (sessionResults.length === 0) {
      return NextResponse.json(
        { error: "No results found" },
        { status: 404 }
      );
    }

    /*
      STEP 2 — Send DB data to Model 2
    */

    const model2Response = await fetch(
      process.env.MODEL2_URL!,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          history: sessionResults,
        }),
      }
    );

    const analysis = await model2Response.json();

    /*
      STEP 3 — Return result
    */

    return NextResponse.json({
      success: true,
      analysis,
    });

  } catch (error) {
    console.error("Analyse error:", error);

    return NextResponse.json(
      { error: "Failed to analyze performance" },
      { status: 500 }
    );
  }
}