import mongoose, { Schema } from "mongoose"
import { z } from "zod"
import { IInvoice } from "@/types/inovice"

// Zod validation schema
export const invoiceSchema = z.object({
  id: z.string().min(1, "Invoice id is required"),
  invoiceNumber: z.string().min(1, "Invoice number is required"),
  date: z.string().min(1, "Invoice date is required"),
  supplierName: z.string().min(1, "Supplier name is required"),
  supplierVAT: z.string().optional(),
  customerName: z.string().min(1, "Customer name is required"),
  customerVAT: z.string().optional(),
  amountBeforeVAT: z.number().min(0, "Amount before VAT must be a positive number"),
  totalVAT: z.number().min(0, "Total VAT must be a positive number"),
  totalAmount: z.number().min(0, "Total amount must be a positive number"),
  qrCodePresent: z.boolean().default(false),
  qrCodeValid: z.boolean().default(false),
  status: z.string().optional(),
  scannedInvoiceId: z.string().optional(), //saved the id if created from scanned invoice
  
  // Additional fields from form
  setAdvancesAndAllocate: z.boolean().default(false),
  writeOffAmount: z.number().default(0),
  supplierAddress: z.string().optional(),
  supplierContactPerson: z.string().optional(),
  dispatchAddress: z.string().optional(),
  shippingAddress: z.string().optional(),
  billingAddress: z.string().optional(),
  paymentTermsTemplate: z.string().optional(),
  terms: z.string().optional(),
  termsAndConditions: z.string().optional(),
  creditTo: z.string().optional(),
  isOpeningEntry: z.string().default("none"),
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
  subscription: z.string().optional(),
  letterHead: z.string().optional(),
  printHeading: z.string().optional(),
  groupSameItems: z.boolean().default(false),
  holdInvoice: z.boolean().default(false),
  isSupplier: z.boolean().default(false),
  supplierGroup: z.string().optional(),
  remarks: z.string().optional(),
  
  // User tracking
  editedBy: z.string().min(1, "Editor ID is required"),
  createdBy: z.string().min(1, "Creator ID is required")
})

// Mongoose schema
const InvoiceSchema: Schema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    invoiceNumber: { type: String },
    date: { type: String},
    supplierName: { type: String},
    supplierVAT: { type: String },
    customerName: { type: String, required: true },
    customerVAT: { type: String },
    amountBeforeVAT: { type: Number, required: true, min: 0 },
    totalVAT: { type: Number, required: true, min: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    qrCodePresent: { type: Boolean, default: false },
    qrCodeValid: { type: Boolean, default: false },
    status: { type: String},
    scannedInvoiceId: { type: String, ref:"invoice-scan" },

    // Additional fields
    setAdvancesAndAllocate: { type: Boolean, default: false },
    writeOffAmount: { type: Number, default:0},
    supplierAddress: { type: String },
    supplierContactPerson: { type: String },
    dispatchAddress: { type: String },
    shippingAddress: { type: String },
    billingAddress: { type: String },
    paymentTermsTemplate: { type: String },
    terms: {type: String},
    termsAndConditions: { type: String },
    creditTo: { type: String },
    isOpeningEntry: { type: String, default: "none" },
    fromDate: { type: String },
    toDate: { type: String },
    subscription: { type: String },
    letterHead: { type: String },
    printHeading: { type: String },
    groupSameItems: { type: Boolean, default: false },
    holdInvoice: { type: Boolean, default: false },
    isSupplier: { type: Boolean, default: false },
    supplierGroup: { type: String },
    remarks: { type: String },
    
    // User tracking
    createdBy: { type: Schema.Types.Mixed, ref: "users", required: true },
    editedBy: { type: Schema.Types.Mixed, ref: "users", required: true },
  },
  { timestamps: true }
)

// Create and export the model
export const Invoice = mongoose.models.Invoice || mongoose.model<IInvoice>("Invoice", InvoiceSchema)