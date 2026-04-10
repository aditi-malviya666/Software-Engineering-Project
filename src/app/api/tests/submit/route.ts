import { persistGeneratedAttempt } from "@/db/queries/test-session";
import { auth } from "@/lib/auth";
import { submitAttemptSchema } from "@/lib/zod/analysis";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = submitAttemptSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid payload",
          details: parsed.error.issues,
        },
        { status: 400 },
      );
    }

    const result = await persistGeneratedAttempt(session.user.id, parsed.data);

    return NextResponse.json({ ok: true, result }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to persist attempt", message },
      { status: 500 },
    );
  }
}
