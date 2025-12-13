// app/api/user/likes/bulk/route.ts
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/dbConfig/dbConfig";
import { Like } from "@/models/likeModel";
import mongoose from "mongoose";

connectToDatabase();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const accountIds = searchParams.get('accountIds');
    const userId = searchParams.get('userId');

    if (!accountIds) {
      return NextResponse.json(
        { success: false, error: "Account IDs are required" },
        { status: 400 }
      );
    }

    const accountIdArray = accountIds.split(',');
    const objectIdArray = accountIdArray.map(id => new mongoose.Types.ObjectId(id));


    // Get like counts for all accounts - FIXED
    const likeCounts = await Like.aggregate([
      {
        $match: { accountId: { $in: objectIdArray } }
      },
      {
        $group: {
          _id: "$accountId",
          count: { $sum: 1 }
        }
      }
    ]);

    // Convert aggregation results to string IDs for easier comparison
    const likeCountsMap = new Map();
    likeCounts.forEach(item => {
      likeCountsMap.set(item._id.toString(), item.count);
    });

    // Check which accounts current user has liked - FIXED
    let userLikes: string[] = [];
    if (userId) {
      const userObjectId = new mongoose.Types.ObjectId(userId);
      const userLikeDocs = await Like.find({ 
        accountId: { $in: objectIdArray }, 
        userId: userObjectId 
      });
      userLikes = userLikeDocs.map(like => like.accountId.toString());
    }

    // Build result - FIXED
    const result: Record<string, { likeCount: number; hasLiked: boolean }> = {};
    
    accountIdArray.forEach(accountId => {
      result[accountId] = {
        likeCount: likeCountsMap.get(accountId) || 0,
        hasLiked: userLikes.includes(accountId)
      };
    });


    return NextResponse.json({
      success: true,
      data: result
    }, { status: 200 });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Error while fetching bulk likes";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}