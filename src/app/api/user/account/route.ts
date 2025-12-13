import { NextResponse } from "next/server"
import { connectToDatabase } from "@/dbConfig/dbConfig"
import { Account, accountSchema } from "@/models/accountModel"

connectToDatabase()

// POST - Create a new account
export async function POST(request: Request) {
  try {
    const reqBody = await request.json()
    console.log("the reqbody: ", reqBody);

    // Validate request body
    const validationResult = accountSchema.safeParse(reqBody)
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

    // Save account in DB
    const newAccount = new Account(validationResult.data)
    const savedAccount = await newAccount.save()

    return NextResponse.json(
      {
        success: true,
        data: savedAccount,
      },
      { status: 201 }
    )
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Error while creating account"
      console.log("error: ", error);
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    )
  }
}

// GET - Get all accounts
export async function GET() {
  try {
    const accounts = await Account.find().sort({ createdAt: -1 })

    return NextResponse.json(
      {
        success: true,
        data: accounts,
      },
      { status: 200 }
    )
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Error while fetching accounts"
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    )
  }
}
