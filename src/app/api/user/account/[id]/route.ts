import { NextResponse } from "next/server"
import { connectToDatabase } from "@/dbConfig/dbConfig"
import { Account, accountSchema } from "@/models/accountModel"
import { Activity} from "@/models/activityModel";

connectToDatabase()

// PATCH - Update an existing account
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } =await params

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "Account ID is required",
        },
        { status: 400 }
      )
    }

    const reqBody = await request.json();
    console.log("the request body: ", reqBody);
    const { userId, ...accountUpdateData } = reqBody

    // Validate request body
    const validationResult = accountSchema.partial().safeParse(accountUpdateData)

    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0];
      return NextResponse.json(
        {
          success: false,
          error: firstError.message,
          field: firstError.path[0],
        },
        { status: 400 }
      )
    }

    // Check if account exists
    const existingAccount = await Account.findById(id)
    if (!existingAccount) {
      return NextResponse.json(
        {
          success: false,
          error: "Account not found",
        },
        { status: 404 }
      )
    }

    // Find what fields are being updated for the activity metadata
    const updatedFields: Record<string, { old: unknown; new: unknown }> = {};
    
    Object.keys(validationResult.data).forEach(key => {
      // don't keep track of edited by as it would be shown
      if (key === 'editedBy') return;
      const newValue = validationResult.data[key as keyof typeof validationResult.data];
      const oldValue = existingAccount[key as keyof typeof existingAccount];
      
      // Only track if the value actually changed
      if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
        // Convert boolean values to "yes"/"no" for activity tracking
        const formatValue = (value: unknown): unknown => {
          if (typeof value === 'boolean') {
            return value ? 'yes' : 'no'
          }
          return value
        }
        
        updatedFields[key] = {
          old: formatValue(oldValue),
          new: formatValue(newValue)
        }
      }
    });


    // Update account in DB
    const updatedAccount = await Account.findByIdAndUpdate(
      id,
      validationResult.data,
      { 
        new: true, // Return updated document
        runValidators: true 
      }
    )

    // Create activity for the update if there are actual changes
    if (Object.keys(updatedFields).length > 0) {
      // You'll need to get the user ID from the request
      // This depends on your auth setup - you might get it from session, token, etc.
      
      if (userId) {
        await Activity.create({
          accountId: id,
          userId: userId,
          activityType: 'update',
          metadata: {
            updatedFields,
            timestamp: new Date().toISOString()
          }
        });
      }
      console.log("the activity created, new one: ")
    }

    return NextResponse.json(
      {
        success: true,
        data: updatedAccount,
      },
      { status: 200 }
    )
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Error while updating account"
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    )
  }
}

// DELETE - Delete an account
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "Account ID is required",
        },
        { status: 400 }
      )
    }

    // Check if account exists
    const existingAccount = await Account.findById(id)
    if (!existingAccount) {
      return NextResponse.json(
        {
          success: false,
          error: "Account not found",
        },
        { status: 404 }
      )
    }

    // Delete account from DB
    await Account.findByIdAndDelete(id)

    return NextResponse.json(
      {
        success: true,
        message: "Account deleted successfully",
      },
      { status: 200 }
    )
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Error while deleting account"
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    )
  }
}

// GET - Get single account by ID
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "Account ID is required",
        },
        { status: 400 }
      )
    }

    const account = await Account.findById(id)

    if (!account) {
      return NextResponse.json(
        {
          success: false,
          error: "Account not found",
        },
        { status: 404 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        data: account,
      },
      { status: 200 }
    )
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Error while fetching account"
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    )
  }
}