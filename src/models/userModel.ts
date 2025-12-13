import mongoose, {Schema } from 'mongoose';
import { z } from 'zod';

// 1. Zod validation schema
export const userSchemaZod = z.object({
  clerkId: z.string().min(1, "Clerk ID is required"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().optional().default(""),
  username: z.string().min(1, "Username is required"),
  email: z.string().email("Invalid email address"),
  profile_image_url: z.string().url("Invalid profile image URL"),
  password: z.string().min(6, "Password must be at least 6 characters").optional(),
  provider: z.enum(["credentials", "google", "apple", "facebook"]),
  forgotPasswordToken: z.string().nullable().optional(),
  forgotPasswordTokenExpiry: z.date().nullable().optional(),
  emailVerified: z.date().nullable().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

// 2. Mongoose schema
const userSchema: Schema = new Schema(
  {
    clerkId: { type: String, required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true, default: '' },
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    profile_image_url: { type: String, required: true },
    password: { type: String },
    provider: {
      type: String,
      enum: ['credentials', 'google', 'apple', 'facebook'],
      default: 'credentials',
    },
    forgotPasswordToken: { type: String, default: null },
    forgotPasswordTokenExpiry: { type: Date, default: null },
    emailVerified: { type: Date, default: null },
  },
  { timestamps: true }
);

// 4. Create the model
const User = mongoose.models.users || mongoose.model('users', userSchema);

export default User;
