import mongoose, { Schema } from "mongoose"
import { z } from "zod"

// Zod validation schema
export const invoiceScanSchema = z.object({
  id: z.string().optional(),
  invoiceNumber: z.string().optional(),
  invoiceDate: z.string().optional(),
  date: z.string().optional(),
  supplierName: z.string().optional(),
  supplierVAT: z.string().optional(),
  customerName: z.string().optional(),
  customerVAT: z.string().optional(),
  amountBeforeVAT: z.number().optional(),
  totalVAT: z.number().optional(),
  totalAmount: z.number().optional(),
  qrCodePresent: z.boolean().optional(),
  qrCodeValid: z.boolean().optional(),
  status: z.string().optional(),
  isInvoiceCreated: z.boolean().optional(),
})

export interface IInvoiceScan extends z.infer<typeof invoiceScanSchema> {
  _id?: string
  createdAt?: Date
  updatedAt?: Date
}

// Mongoose schema
const InvoiceScanSchema: Schema = new Schema(
  {
    id: { type: String },
    invoiceNumber: { type: String },
    invoiceDate: { type: String },
    date: { type: String },
    supplierName: { type: String },
    supplierVAT: { type: String },
    customerName: { type: String },
    customerVAT: { type: String },
    amountBeforeVAT: { type: Number },
    totalVAT: { type: Number },
    totalAmount: { type: Number },
    qrCodePresent: { type: Boolean },
    qrCodeValid: { type: Boolean },
    status: { type: String },
    isInvoiceCreated: { type: Boolean },
  },
  { timestamps: true }
)

// Create and export the model
export const InvoiceScan =
  mongoose.models["invoice-scan"] || mongoose.model<IInvoiceScan>("invoice-scan", InvoiceScanSchema)
