import { NextRequest, NextResponse } from "next/server";
import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";
import fs from "fs";
import path from "path";
import { InvoiceScan, invoiceScanSchema } from "@/models/invoiceScanModel";
import { connectToDatabase } from "@/dbConfig/dbConfig";

connectToDatabase();

export const runtime = "nodejs";

// GET all invoice scans
export async function GET() {
  try {
    const invoiceScans = await InvoiceScan.find({})
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ 
      success: true, 
      data: invoiceScans 
    });

  } catch (error) {
    console.error("Error fetching invoice scans:", error);
    return NextResponse.json(
      { 
        success: false,
        error: "Failed to fetch invoice scans" 
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  let formData;
  try {
    formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ success: false, message: "No file uploaded" }, { status: 400 });
    }

    console.log(`Received file: ${file.name}, size: ${file.size} bytes, type: ${file.type}`);
    console.log("the whole received file: ", file);
  
    // Save the uploaded file to disk
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const mediaType = file.type.startsWith("image/")
      ? file.type                    // image/png or image/jpeg etc.
      : "application/pdf";

    const { text } = await generateText({
      model: openai("gpt-4o-mini"),
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `You are an expert invoice data extractor. 
              Analyze the provided PDF invoice document and return ONLY a valid JSON object with the following keys:
              - id
              - invoiceNumber
              - invoiceDate
              - date
              - supplierName
              - supplierVAT
              - customerName
              - customerVAT
              - amountBeforeVAT
              - totalVAT
              - totalAmount
              - qrCodePresent
              - qrCodeValid

              **Important extraction rules:**
              - The "id" field should capture the invoice's internal identifier (even if labeled as "Invoice ID", "Invoice No", "invoiceId", or any similar term).
              - Be case-insensitive and label-insensitive for all fields.
              - "invoiceNumber" should match any field that looks like an invoice or reference number.
              - Use empty strings ("") for missing text fields.
              - Use 0 for missing numeric fields.
              - "qrCodePresent" = true if a QR code exists, else false.
              - "qrCodeValid" = true if the QR appears to encode structured invoice or VAT data.
              - Dates must be formatted as "YYYY-MM-DD" (ISO).
              - Return strictly valid JSON — no explanations or extra text.`,
            },
            {
              type: "file",
              data: buffer,
              mediaType: mediaType,
              filename: file.name,
            },
          ],
        },
      ],
    });

    console.log("Extracted Invoice JSON:", text);

    // Clean the text to remove markdown code blocks
    const cleanedText = text.replace(/```json\n?|\n?```/g, '').trim();

    // Try parsing text into JSON
    let extractedData;
    try {
      extractedData = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error("Failed to parse extracted JSON:", parseError);
      return NextResponse.json(
        { 
          success: false,
          error: "Failed to parse extracted invoice data", 
          details: String(parseError) 
        },
        { status: 500 }
      );
    }

    

    // Validate the extracted data
    const validatedData = invoiceScanSchema.parse(extractedData);

    if(!validatedData.id){
      return NextResponse.json(
        { 
          success: false,
          error: "Extracted invoice data is missing required fields" 
        },
        { status: 500 }
      );
    }

    // check if the invoice with same id already present in the db
     if (validatedData.id) {
      const existingInvoice = await InvoiceScan.findOne({ id: validatedData.id });
      
      if (existingInvoice) {
        return NextResponse.json(
          { 
            success: false,
            error: "Invoice already exists",
            message: `An invoice with ID "${validatedData.id}" already exists in the database`,
            existingInvoice: existingInvoice
          },
          { status: 409 } // 409 Conflict
        );
      }
    }

    // Add system fields
    const invoiceScanData = {
      ...validatedData,
      isInvoiceCreated: false, // Default to false
      status: "Pending",
    };

    // Save to MongoDB
    const savedInvoiceScan = await InvoiceScan.create(invoiceScanData);

    console.log("Invoice scan saved to database:", savedInvoiceScan._id);

    return NextResponse.json({ 
      success: true, 
      data: savedInvoiceScan,
      message: "Invoice processed and saved successfully" 
    });

  } catch (err) {
    console.error("Error extracting invoice data:", err);
    
    // Clean up temporary file in case of error
    try {
      const file = formData?.get("file") as File;
      if (file) {
        const filePath = path.join(process.cwd(), "tmp", file.name);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
    } catch (cleanupError) {
      console.error("Failed to clean up temporary file:", cleanupError);
    }

    return NextResponse.json(
      { 
        success: false,
        error: "Something went wrong", 
        details: String(err) 
      },
      { status: 500 }
    );
  }
}