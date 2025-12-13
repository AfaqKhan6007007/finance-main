// src/dbConfig/dbConfig.ts
import mongoose from "mongoose";

let cachedConnection: typeof mongoose | null = null;

export async function connectToDatabase() {
    if (cachedConnection) {
        return cachedConnection;
    }

    try {
        const uri = process.env.MONGODB_URI;
        if (!uri) throw new Error("MONGODB_URI is missing in .env");
        
        const connection = await mongoose.connect(uri);
        console.log("Database connected successfully");
        cachedConnection = connection;
        return connection;
    } catch (error) {
        console.error("Database connection error: ", error);
        throw error; // Re-throw to handle in calling function
    }
}