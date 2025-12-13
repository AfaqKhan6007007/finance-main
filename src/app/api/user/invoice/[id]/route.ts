import { NextResponse } from "next/server"
import { connectToDatabase } from "@/dbConfig/dbConfig"
import { Invoice, invoiceSchema } from "@/models/invoiceModel"
import { Activity } from "@/models/activityModel"

connectToDatabase()

// GET - Get single invoice by ID
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
          error: "Invoice ID is required",
        },
        { status: 400 }
      )
    }

    const invoice = await Invoice.findOne({ $or: [{ _id: id }, { id: id }] })

    if (!invoice) {
      return NextResponse.json(
        {
          success: false,
          error: "Invoice not found",
        },
        { status: 404 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        data: invoice,
      },
      { status: 200 }
    )
  } catch (error: unknown) {
    console.error("Error fetching invoice:", error)
    const errorMessage =
      error instanceof Error ? error.message : "Error while fetching invoice"
    
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    )
  }
}

// PUT - Update an existing invoice
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "Invoice ID is required",
        },
        { status: 400 }
      )
    }

    const reqBody = await request.json()

    // Validate request body - use partial schema for updates
    const validationResult = invoiceSchema.partial().safeParse(reqBody)
    console.log("Validation result:", validationResult)

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

    // Check if invoice exists
    const existingInvoice = await Invoice.findOne({ $or: [{ _id: id }, { id: id }] })
    if (!existingInvoice) {
      return NextResponse.json(
        {
          success: false,
          error: "Invoice not found",
        },
        { status: 404 }
      )
    }

    // If invoice number is being updated, check for duplicates
    if (validationResult.data.invoiceNumber && 
        validationResult.data.invoiceNumber !== existingInvoice.invoiceNumber) {
      const duplicateInvoice = await Invoice.findOne({ 
        invoiceNumber: validationResult.data.invoiceNumber,
        _id: { $ne: existingInvoice._id }
      })
      
      if (duplicateInvoice) {
        return NextResponse.json(
          {
            success: false,
            error: "Invoice number already exists",
          },
          { status: 409 }
        )
      }
    }

     // Find what fields are being updated for the activity metadata
    const updatedFields: Record<string, { old: unknown; new: unknown }> = {}
    
    Object.keys(validationResult.data).forEach(key => {
      // Don't track editedBy as it would be shown in every update
      if (key === 'editedBy' || key === 'scannedInvoiceId') return

      
      const newValue = validationResult.data[key as keyof typeof validationResult.data]
      const oldValue = existingInvoice[key as keyof typeof existingInvoice]
      
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

    // Update invoice in DB
    const updatedInvoice = await Invoice.findOneAndUpdate(
      { $or: [{ _id: id }, { id: id }] },
      validationResult.data,
      { 
        new: true, // Return updated document
        runValidators: true 
      }
    )

    if (Object.keys(updatedFields).length > 0 && validationResult.data.editedBy) {
      await Activity.create({
        invoiceId: existingInvoice._id,
        userId: validationResult.data.editedBy,
        activityType: 'update',
        metadata: {
          updatedFields,
          invoiceNumber: existingInvoice.invoiceNumber,
          timestamp: new Date().toISOString()
        }
      })
    }

    return NextResponse.json(
      {
        success: true,
        data: updatedInvoice,
        message: "Invoice updated successfully",
      },
      { status: 200 }
    )
  } catch (error: unknown) {
    console.error("Error updating invoice:", error)
    const errorMessage =
      error instanceof Error ? error.message : "Error while updating invoice"
    
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    )
  }
}

// DELETE - Delete an invoice
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
          error: "Invoice ID is required",
        },
        { status: 400 }
      )
    }

    // Check if invoice exists
    const existingInvoice = await Invoice.findOne({ $or: [{ _id: id }, { id: id }] })
    if (!existingInvoice) {
      return NextResponse.json(
        {
          success: false,
          error: "Invoice not found",
        },
        { status: 404 }
      )
    }

    // Delete invoice from DB
    await Invoice.findOneAndDelete({ $or: [{ _id: id }, { id: id }] })

    return NextResponse.json(
      {
        success: true,
        message: "Invoice deleted successfully",
      },
      { status: 200 }
    )
  } catch (error: unknown) {
    console.error("Error deleting invoice:", error)
    const errorMessage =
      error instanceof Error ? error.message : "Error while deleting invoice"
    
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    )
  }
}