import mongoose,{Types} from "mongoose";

export interface ILike extends mongoose.Document {
  accountId: Types.ObjectId;
  userId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}