import mongoose, { Schema} from "mongoose"
import { z } from "zod"
import { IAccount } from "@/types/account"

// Zod validation schema
export const accountSchema = z.object({
  id: z.string().min(1, "ID is required"),
  disable: z.boolean().default(false),
  accountName: z.string().min(1, "Account name is required"),
  accountNumber: z.string().optional(),
  isGroup: z.boolean().default(false),
  company: z.string().min(1, "Company is required"),
  taxRate: z.string().optional(),
  currency: z.string().default("none"),
  parentAccount: z.string().min(1, "Parent account is required"),
  accountType: z.string().default("none"),
  balanceMustBe: z.string().default("none"),
  rootType: z.string().optional(),
  reportType: z.string().optional(),
  frozen: z.string().default("no"),
  editedBy: z.string().min(1, "Your id is missing, authentication required."),
  createdBy: z.string().min(1, "Your id is missing, please authenticate.")
})

// Mongoose schema
const AccountSchema: Schema = new Schema(
  {
    id: { type: String },
    disable: { type: Boolean, default: false },
    accountName: { type: String, required: true },
    accountNumber: { type: String },
    isGroup: { type: Boolean, default: false },
    company: { type: String, required: true },
    taxRate: { type: String },
    currency: {
      type: String,
      default: "none",
    },
    parentAccount: { type: String, required: true },
    accountType: {
      type: String,
      default: "none",
    },
    balanceMustBe: {
      type: String,
      default: "none",
    },
    rootType: { type: String },
    reportType: { type: String },
    frozen: {type: String, default:"no"},
    createdBy: {type: Schema.Types.Mixed, ref: "users", required: true},
    editedBy: {type: Schema.Types.Mixed, ref: "users", required: true},
  },
  { timestamps: true }
)

// Create and export the model
export const Account =
  mongoose.models.Account || mongoose.model<IAccount>("Account", AccountSchema)
