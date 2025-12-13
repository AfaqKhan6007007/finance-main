// app/api/kanban/[id]/route.ts
import { NextResponse } from "next/server"
import { connectToDatabase } from "@/dbConfig/dbConfig"
import { KanbanView, kanbanViewSchemaZod } from "@/models/kanbanViewModel"

connectToDatabase()

// PATCH - Update an existing kanban view
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
          error: "Kanban view ID is required",
        },
        { status: 400 }
      )
    }

    const reqBody = await request.json()

    // Validate request body
    const validationResult = kanbanViewSchemaZod.partial().safeParse(reqBody)

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

    // Check if kanban view exists
    const existingKanban = await KanbanView.findById(id)
    if (!existingKanban) {
      return NextResponse.json(
        {
          success: false,
          error: "Kanban view not found",
        },
        { status: 404 }
      )
    }

    // Check for duplicate name if name is being updated
    if (validationResult.data.name && validationResult.data.name !== existingKanban.name) {
      const duplicateKanban = await KanbanView.findOne({ 
        name: validationResult.data.name 
      })
      
      if (duplicateKanban) {
        return NextResponse.json(
          {
            success: false,
            error: "Kanban view with this name already exists",
          },
          { status: 409 }
        )
      }
    }

    // Update kanban view in DB
    const updatedKanban = await KanbanView.findByIdAndUpdate(
      id,
      validationResult.data,
      { 
        new: true, // Return updated document
        runValidators: true 
      }
    )

    return NextResponse.json(
      {
        success: true,
        data: updatedKanban,
      },
      { status: 200 }
    )
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Error while updating kanban view"
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    )
  }
}

// DELETE - Delete a kanban view
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
          error: "Kanban view ID is required",
        },
        { status: 400 }
      )
    }

    // Check if kanban view exists
    const existingKanban = await KanbanView.findById(id)
    if (!existingKanban) {
      return NextResponse.json(
        {
          success: false,
          error: "Kanban view not found",
        },
        { status: 404 }
      )
    }

    // Delete kanban view from DB
    await KanbanView.findByIdAndDelete(id)

    return NextResponse.json(
      {
        success: true,
        message: "Kanban view deleted successfully",
      },
      { status: 200 }
    )
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Error while deleting kanban view"
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    )
  }
}

// GET - Get single kanban view by ID
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
          error: "Kanban view ID is required",
        },
        { status: 400 }
      )
    }

    const kanban = await KanbanView.findById(id)

    if (!kanban) {
      return NextResponse.json(
        {
          success: false,
          error: "Kanban view not found",
        },
        { status: 404 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        data: kanban,
      },
      { status: 200 }
    )
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Error while fetching kanban view"
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    )
  }
}