import { getAnalysisSummary } from "@/db/queries/analysis";
import { auth } from "@/lib/auth";
import { analysisSummarySchema } from "@/lib/zod/analysis";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const summary = await getAnalysisSummary(session.user.id);
    const validated = analysisSummarySchema.parse(summary);

    return NextResponse.json(validated, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to fetch analysis summary", message },
      { status: 500 },
    );
  }
}
