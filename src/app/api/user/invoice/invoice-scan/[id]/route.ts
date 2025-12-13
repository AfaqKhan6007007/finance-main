import { NextRequest, NextResponse } from "next/server";
import { InvoiceScan, invoiceScanSchema } from "@/models/invoiceScanModel";
import { connectToDatabase } from "@/dbConfig/dbConfig";

connectToDatabase();

// GET single invoice scan by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const invoiceScan = await InvoiceScan.findById(id);

    if (!invoiceScan) {
      return NextResponse.json(
        { success: false, error: "Invoice scan not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: invoiceScan });

  } catch (error) {
    console.error("Error fetching invoice scan:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch invoice scan" },
      { status: 500 }
    );
  }
}

// PUT - Update invoice scan by ID
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json();
    
    // Validate the incoming data
    const validatedData = invoiceScanSchema.parse(body);
    
    const updatedInvoiceScan = await InvoiceScan.findByIdAndUpdate(
      id,
      validatedData,
      { new: true, runValidators: true }
    );

    if (!updatedInvoiceScan) {
      return NextResponse.json(
        { success: false, error: "Invoice scan not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      data: updatedInvoiceScan,
      message: "Invoice scan updated successfully" 
    });

  } catch (error) {
    console.error("Error updating invoice scan:", error);
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: "Invalid data format", details: error.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: "Failed to update invoice scan" },
      { status: 500 }
    );
  }
}

// DELETE - Delete invoice scan by ID
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const deletedInvoiceScan = await InvoiceScan.findByIdAndDelete(id);

    if (!deletedInvoiceScan) {
      return NextResponse.json(
        { success: false, error: "Invoice scan not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: "Invoice scan deleted successfully" 
    });

  } catch (error) {
    console.error("Error deleting invoice scan:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete invoice scan" },
      { status: 500 }
    );
  }
}