import mongoose, { Schema, Types } from "mongoose";
import { z } from "zod";
import { IActivity } from "@/types/activity";


export const activitySchema = z.object({
  accountId: z.string().optional(),
  journalId: z.string().optional(),
  invoiceId: z.string().optional(),
  companyId: z.string().optional(),
  userId: z.string().min(1, "User ID is required"),
  activityType: z.string().min(1, "Activity type is required"),
  metadata: z.any().optional(), // generic metadata object
}).refine(
  (data) => !!data.accountId || !!data.journalId || !!data.invoiceId || !!data.companyId, 
  {
    message: "Id is required",
  }
);


const ActivitySchema: Schema = new Schema(
  {
    accountId: { type: Types.ObjectId, ref:'accounts' },
    journalId: { type: Types.ObjectId, ref:'journalEntry' },
    invoiceId: { type: Types.ObjectId, ref:'invoice' },
    companyId: {type: Types.ObjectId, ref: 'companies'},
    userId: { type: Schema.Types.Mixed, ref:'users', required: true },  // use mix id for MongoDB user ID or the Administrator ID
    activityType: { type: String, required: true },
    metadata: { type: Schema.Types.Mixed },    // flexible for any metadata type
  },
  { timestamps: true } // createdAt and updatedAt automatically managed
);


export const Activity =
  mongoose.models.Activity ||
  mongoose.model<IActivity>("Activity", ActivitySchema);
