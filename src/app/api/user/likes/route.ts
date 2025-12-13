import { NextResponse } from "next/server";
import { connectToDatabase } from "@/dbConfig/dbConfig";
import { likeSchema, Like } from "@/models/likeModel";
import { Activity } from "@/models/activityModel";

connectToDatabase();


// GET - Get like count and check if current user has liked
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('accountId');
    const userId = searchParams.get('userId');

    if (!accountId) {
      return NextResponse.json(
        { success: false, error: "Account ID is required" },
        { status: 400 }
      );
    }

    // Get total like count for this account
    const likeCount = await Like.countDocuments({ accountId });

    // Check if current user has liked this account
    let hasLiked = false;
    if (userId) {
      const userLike = await Like.findOne({ accountId, userId });
      hasLiked = !!userLike;
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          likeCount,
          hasLiked
        },
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Error while fetching likes";
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}


// POST - Toggle Like (Create or Delete)
export async function POST(request: Request) {
  try {
    const reqBody = await request.json();

    // Validate request body with Zod
    const validationResult = likeSchema.safeParse(reqBody);
    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0];
      return NextResponse.json(
        {
          success: false,
          error: firstError.message,
          field: firstError.path[0],
        },
        { status: 400 }
      );
    }

    const { accountId, userId } = validationResult.data;

    // Check if like already exists
    const existingLike = await Like.findOne({ accountId, userId });

    if (!existingLike) {
      // ✅ Create new Like
      const newLike = new Like({ accountId, userId });
      await newLike.save();

      // ✅ Create corresponding Activity
      await Activity.create({
        accountId,
        userId,
        activityType: "like",
        metadata: {},
      });

      return NextResponse.json(
        {
          success: true,
          action: "liked",
          message: "Like added successfully",
        },
        { status: 201 }
      );
    } else {
      // ✅ Remove Like
      await Like.findByIdAndDelete(existingLike._id);

      // ✅ Remove corresponding Activity
      await Activity.findOneAndDelete({
        accountId,
        userId,
        activityType: "like",
      });

      return NextResponse.json(
        {
          success: true,
          action: "unliked",
          message: "Like removed successfully",
        },
        { status: 200 }
      );
    }
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Error while toggling like";
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
