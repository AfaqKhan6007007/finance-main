import { NextResponse } from "next/server"
import { connectToDatabase } from "@/dbConfig/dbConfig"
import { Invoice, invoiceSchema } from "@/models/invoiceModel"

connectToDatabase()

// POST - Create a new invoice
export async function POST(request: Request) {
  try {
    const reqBody = await request.json()
    console.log("Request body:", reqBody)
    // Validate request body
    const validationResult = invoiceSchema.safeParse(reqBody)
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

    console.log("the invoice id to be checked: ", validationResult.data.id)

    // Check if invoice number already exists
    const existingInvoice = await Invoice.findOne({ 
      id: validationResult.data.id 
    })
    console.log("Existing invoice check:", existingInvoice)
    
    if (existingInvoice) {
      return NextResponse.json(
        {
          success: false,
          error: "Invoice id already exists",
        },
        { status: 409 }
      )
    }

    // Save invoice in DB
    const newInvoice = new Invoice(validationResult.data)
    const savedInvoice = await newInvoice.save()

    return NextResponse.json(
      {
        success: true,
        data: savedInvoice,
        message: "Invoice created successfully",
      },
      { status: 201 }
    )
  } catch (error: unknown) {
    console.error("Error creating invoice:", error)
    const errorMessage =
      error instanceof Error ? error.message : "Error while creating invoice"
    
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    )
  }
}

// GET - Get all invoices
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const status = searchParams.get("status")
    const search = searchParams.get("search")
    const sortBy = searchParams.get("sortBy") || "createdAt"
    const sortOrder = searchParams.get("sortOrder") || "desc"

    // Build query
    const query: Record<string, unknown> = {}
    
    if (status && status !== "all") {
      query.status = status
    }
    
    if (search) {
      query.$or = [
        { invoiceNumber: { $regex: search, $options: "i" } },
        { supplierName: { $regex: search, $options: "i" } },
        { customerName: { $regex: search, $options: "i" } },
      ]
    }

    // Calculate pagination
    const skip = (page - 1) * limit

    // Execute queries
    const [invoices, totalCount] = await Promise.all([
      Invoice.find(query)
        .sort({ [sortBy]: sortOrder === "desc" ? -1 : 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Invoice.countDocuments(query)
    ])

    return NextResponse.json(
      {
        success: true,
        data: invoices,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit),
        },
      },
      { status: 200 }
    )
  } catch (error: unknown) {
    console.error("Error fetching invoices:", error)
    const errorMessage =
      error instanceof Error ? error.message : "Error while fetching invoices"
    
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    )
  }
}