import { ILike } from "@/types/likes";
import mongoose, { Schema, Types } from "mongoose";
import { z } from "zod";


export const likeSchema = z.object({
  accountId: z.string().min(1, "Account ID is required"),
  userId: z.string().min(1, "User ID is required"),
});


const LikeSchema: Schema = new Schema(
  {
    accountId: { type: Types.ObjectId, ref: "accounts", required: true },
    userId: { type: Types.ObjectId, ref: "users", required: true },
  },
  { timestamps: true }
);


LikeSchema.index({ accountId: 1, userId: 1 }, { unique: true });




export const Like =
  mongoose.models.Like || mongoose.model<ILike>("Like", LikeSchema);
