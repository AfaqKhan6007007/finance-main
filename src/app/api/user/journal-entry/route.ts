import { NextResponse } from "next/server"
import { connectToDatabase } from "@/dbConfig/dbConfig"
import { JournalEntry, journalEntrySchema } from "@/models/journalEntryModel"

connectToDatabase()

// POST - Create a new journal entry
export async function POST(request: Request) {
  try {
    const reqBody = await request.json()

    // Validate request body
    const validationResult = journalEntrySchema.safeParse(reqBody)
    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0]
      return NextResponse.json(
        {
          success: false,
          error: firstError.message,
          field: firstError.path[0],
        },
        { status: 400 }
      )
    }


    // Generate id number if not provided
    let journalIdNumber = validationResult.data.id
    if (!journalIdNumber || journalIdNumber.trim() === "") {
      // Find the latest entry number and increment
      const latestEntry = await JournalEntry.findOne().sort({ id: -1 })
      console.log("the latest entry found: ", latestEntry)
      if (latestEntry && latestEntry.id) {
        const lastNumber = parseInt(latestEntry.id.match(/\d+/)?.[0] || "0")
        journalIdNumber = `JE${String(lastNumber + 1).padStart(4, "0")}`
      } else {
        journalIdNumber = "JE0001"
      }
      validationResult.data.id = journalIdNumber
    }

    // Save journal entry in DB
    const newJournalEntry = new JournalEntry(validationResult.data)
    const savedJournalEntry = await newJournalEntry.save()

    return NextResponse.json(
      {
        success: true,
        data: savedJournalEntry,
      },
      { status: 201 }
    )
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Error while creating journal entry"
    console.log("Error creating journal entry:", error)
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    )
  }
}

// GET - Get all journal entries
export async function GET() {
  try {
    const journalEntries = await JournalEntry.find()
      .populate("debitAccount", "id accountName")
      .populate("creditAccount", "id accountName")
      .populate("createdBy", "name email")
      .populate("editedBy", "name email")
      .sort({ date: -1, createdAt: -1 })

    return NextResponse.json(
      {
        success: true,
        data: journalEntries,
      },
      { status: 200 }
    )
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Error while fetching journal entries"
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    )
  }
}