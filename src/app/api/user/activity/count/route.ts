import { NextResponse } from "next/server";
import { connectToDatabase } from "@/dbConfig/dbConfig";
import { Activity } from "@/models/activityModel";

connectToDatabase();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get("accountId");
    const activityType = searchParams.get("activityType");

    if (!accountId || !activityType) {
      return NextResponse.json(
        { success: false, error: "Missing parameters" },
        { status: 400 }
      );
    }

    const total = await Activity.countDocuments({
      accountId,
      activityType,
    });

    return NextResponse.json({ success: true, total });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to count";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
