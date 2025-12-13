import mongoose, { Schema } from "mongoose"
import { z } from "zod"

// Zod validation schema
export const journalEntrySchema = z.object({
  id: z.string().optional(),
  date: z.string().min(1, "Date is required"),
  account: z.string().min(1, "Account is required"), //this is the account used for the journal entry
  debitAccount: z.string().min(1, "Debit account is required"), //accounnt for which debit is selected currently same as account
  creditAccount: z.string().min(1, "Credit account is required"), //accounnt for which credit is selected currently same as account
  amount: z.number(), //the max amount between debit and credit
  debit: z.number().optional(), //amount to be debit
  credit: z.number().optional(),//amount to be credit
  description: z.string().optional(),
  createdBy: z.string().min(1, "Creator ID is required"),
  editedBy: z.string().min(1, "Editor ID is required"),
})

export interface IJournalEntry extends z.infer<typeof journalEntrySchema> {
  _id?: string
  createdAt?: Date
  updatedAt?: Date
}

// Mongoose schema
const JournalEntrySchema: Schema = new Schema(
  {
    id: { type: String, required: true },
    date: { type: Date, required: true },
    account: { type: String, required: true, ref: "Account" },
    debitAccount: { type: String, required: true, ref: "Account" },
    creditAccount: { type: String, required: true, ref: "Account" },
    amount: { type: Number},
    debit: { type: Number },
    credit: { type: Number },
    description: { type: String },
    createdBy: { type: Schema.Types.Mixed, ref: "users", required: true },
    editedBy: { type: Schema.Types.Mixed, ref: "users", required: true },
  },
  { timestamps: true }
)

// Create and export the model
export const JournalEntry =
  mongoose.models["journal-entry"]  || mongoose.model<IJournalEntry>("journal-entry", JournalEntrySchema)