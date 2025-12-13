// app/api/kanban/route.ts
import { NextResponse } from "next/server"
import { connectToDatabase } from "@/dbConfig/dbConfig"
import { KanbanView, kanbanViewSchemaZod } from "@/models/kanbanViewModel"

connectToDatabase()

// POST - Create a new kanban view
export async function POST(request: Request) {
  try {
    const reqBody = await request.json()

    // Validate request body
    const validationResult = kanbanViewSchemaZod.safeParse(reqBody)

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

    // Check if kanban with same name already exists
    const existingKanban = await KanbanView.findOne({ 
      name: validationResult.data.name 
    })

    if (existingKanban) {
      return NextResponse.json(
        {
          success: false,
          error: "Kanban view with this name already exists",
        },
        { status: 409 }
      )
    }

    // Save kanban in DB
    const newKanban = new KanbanView(validationResult.data)
    const savedKanban = await newKanban.save()

    return NextResponse.json(
      {
        success: true,
        data: savedKanban,
      },
      { status: 201 }
    )
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Error while creating kanban view"
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    )
  }
}

// GET - Get all kanban views
export async function GET() {
  try {
    const kanbans = await KanbanView.find().sort({ createdAt: -1 })

    return NextResponse.json(
      {
        success: true,
        data: kanbans,
      },
      { status: 200 }
    )
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Error while fetching kanban views"
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    )
  }
}