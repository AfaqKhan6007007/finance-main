import { NextResponse } from "next/server"
import { connectToDatabase } from "@/dbConfig/dbConfig"
import { JournalEntry, journalEntrySchema } from "@/models/journalEntryModel"
import { Activity } from "@/models/activityModel"

connectToDatabase()

// GET - Get single journal entry by ID
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
          error: "Journal entry ID is required",
        },
        { status: 400 }
      )
    }

    const journalEntry = await JournalEntry.findById(id)
      .populate("debitAccount", "id accountName")
      .populate("creditAccount", "id accountName")
      .populate("createdBy", "name email")
      .populate("editedBy", "name email")

    if (!journalEntry) {
      return NextResponse.json(
        {
          success: false,
          error: "Journal entry not found",
        },
        { status: 404 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        data: journalEntry,
      },
      { status: 200 }
    )
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Error while fetching journal entry"
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    )
  }
}

// PATCH - Update an existing journal entry
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "Journal entry ID is required",
        },
        { status: 400 }
      )
    }

    const reqBody = await request.json()
    const { userId, ...journalEntryUpdateData } = reqBody

    // Validate request body
    const validationResult = journalEntrySchema.partial().safeParse(journalEntryUpdateData)

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

    // Check if journal entry exists
    const existingJournalEntry = await JournalEntry.findById(id)
    if (!existingJournalEntry) {
      return NextResponse.json(
        {
          success: false,
          error: "Journal entry not found",
        },
        { status: 404 }
      )
    }

    // Find what fields are being updated for the activity metadata
    const updatedFields: Record<string, { old: unknown; new: unknown }> = {}

    Object.keys(validationResult.data).forEach((key) => {
      // Don't track editedBy as it would be shown
      if (key === "editedBy") return
      const newValue = validationResult.data[key as keyof typeof validationResult.data]
      const oldValue = existingJournalEntry[key as keyof typeof existingJournalEntry]

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
    })

    // Update journal entry in DB
    const updatedJournalEntry = await JournalEntry.findByIdAndUpdate(
      id,
      validationResult.data,
      {
        new: true, // Return updated document
        runValidators: true,
      }
    )
      .populate("debitAccount", "id accountName")
      .populate("creditAccount", "id accountName")
      .populate("createdBy", "name email")
      .populate("editedBy", "name email")

    // Create activity for the update if there are actual changes
    if (Object.keys(updatedFields).length > 0 && userId) {
      await Activity.create({
        journalId: id,
        userId: userId,
        activityType: "update",
        metadata: {
          updatedFields,
          timestamp: new Date().toISOString(),
        },
      })
      console.log("Activity created for journal entry update")
    }

    return NextResponse.json(
      {
        success: true,
        data: updatedJournalEntry,
      },
      { status: 200 }
    )
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Error while updating journal entry"
    console.log("Error updating journal entry:", error)
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    )
  }
}

// DELETE - Delete a journal entry
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
          error: "Journal entry ID is required",
        },
        { status: 400 }
      )
    }

    // Check if journal entry exists
    const existingJournalEntry = await JournalEntry.findById(id)
    if (!existingJournalEntry) {
      return NextResponse.json(
        {
          success: false,
          error: "Journal entry not found",
        },
        { status: 404 }
      )
    }

    // Delete journal entry from DB
    await JournalEntry.findByIdAndDelete(id)

    // Also delete associated activities
    await Activity.deleteMany({ journalEntryId: id })

    return NextResponse.json(
      {
        success: true,
        message: "Journal entry deleted successfully",
      },
      { status: 200 }
    )
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Error while deleting journal entry"
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    )
  }
}