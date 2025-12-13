// app/api/user/activity/count/bulk/route.ts
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/dbConfig/dbConfig";
import { Activity } from "@/models/activityModel";
import mongoose from "mongoose";

connectToDatabase();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const accountIds = searchParams.get("accountIds");
    const activityType = searchParams.get("activityType") || "comment";

    if (!accountIds) {
      return NextResponse.json(
        { success: false, error: "Account IDs are required" },
        { status: 400 }
      );
    }

    const accountIdArray = accountIds.split(',');

    // Convert string accountIds to ObjectId for querying
    const objectIdArray = accountIdArray.map(id => new mongoose.Types.ObjectId(id));

    const commentCounts = await Activity.aggregate([
      {
        $match: { 
          accountId: { $in: objectIdArray }, // Use ObjectId here
          activityType 
        }
      },
      {
        $group: {
          _id: "$accountId",
          count: { $sum: 1 }
        }
      }
    ]);


    // Convert to a more usable format
    const result: Record<string, number> = {};
    
    accountIdArray.forEach(accountId => {
      // Convert the accountId to ObjectId for comparison
      const objectId = new mongoose.Types.ObjectId(accountId);
      const commentData = commentCounts.find(item => 
        item._id.toString() === objectId.toString()
      );
      result[accountId] = commentData?.count || 0;
    });

    return NextResponse.json({ 
      success: true, 
      data: result 
    });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to count activities";
    console.error("Error in bulk comments API:", error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}