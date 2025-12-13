import { NextResponse } from "next/server";
import { connectToDatabase } from "@/dbConfig/dbConfig";
import { Activity, activitySchema } from "@/models/activityModel";

connectToDatabase();


export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "Activity ID is required",
        },
        { status: 400 }
      );
    }

    const reqBody = await request.json();

    // Validate only the fields being updated
    const validationResult = activitySchema.partial().safeParse(reqBody);
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

    // Check if activity exists
    const existingActivity = await Activity.findById(id);
    if (!existingActivity) {
      return NextResponse.json(
        {
          success: false,
          error: "Activity not found",
        },
        { status: 404 }
      );
    }

    // Update activity
    const updatedActivity = await Activity.findByIdAndUpdate(
      id,
      validationResult.data,
      {
        new: true, // return updated document
        runValidators: true,
      }
    );

    return NextResponse.json(
      {
        success: true,
        data: updatedActivity,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Error while updating activity";
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}


export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "Activity ID is required",
        },
        { status: 400 }
      );
    }

    const existingActivity = await Activity.findById(id);
    if (!existingActivity) {
      return NextResponse.json(
        {
          success: false,
          error: "Activity not found",
        },
        { status: 404 }
      );
    }

    await Activity.findByIdAndDelete(id);

    return NextResponse.json(
      {
        success: true,
        message: "Activity deleted successfully",
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Error while deleting activity";
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}


export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "Activity ID is required",
        },
        { status: 400 }
      );
    }

    const activity = await Activity.findById(id);
    if (!activity) {
      return NextResponse.json(
        {
          success: false,
          error: "Activity not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: activity,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Error while fetching activity";
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
