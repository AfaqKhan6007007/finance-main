import { NextResponse } from "next/server";
import { connectToDatabase } from "@/dbConfig/dbConfig";
import { Activity, activitySchema } from "@/models/activityModel";

connectToDatabase();

export async function POST(request: Request) {
  try {
    const reqBody = await request.json();

    // Validate request body using Zod
    const validationResult = activitySchema.safeParse(reqBody);
    console.log("the result of validation", validationResult); 
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

    // Save activity to DB
    const newActivity = new Activity(validationResult.data);
    const savedActivity = await newActivity.save();

    return NextResponse.json(
      {
        success: true,
        data: savedActivity,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Error while creating activity";

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}


// export async function GET() {
//   try {
//     const activities = await Activity.find().sort({ createdAt: -1 });

//     return NextResponse.json(
//       {
//         success: true,
//         data: activities,
//       },
//       { status: 200 }
//     );
//   } catch (error: unknown) {
//     const errorMessage =
//       error instanceof Error ? error.message : "Error while fetching activities";

//     return NextResponse.json(
//       {
//         success: false,
//         error: errorMessage,
//       },
//       { status: 500 }
//     );
//   }
// }

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('accountId');
    const journalId = searchParams.get('journalId');
    const invoiceId = searchParams.get('invoiceId');
    const companyId = searchParams.get('companyId');

    let query = {};
    if (accountId) {
      query = { accountId };
    } else if (journalId) {
      query = { journalId };
    } else if (invoiceId) {
      query = {invoiceId};
    } else if (companyId) {
      query = {companyId}
    }

    const activities = await Activity.find(query).sort({ createdAt: -1 });

    return NextResponse.json(
      {
        success: true,
        data: activities,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Error while fetching activities";

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
