import mongoose from "mongoose";

const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI environment variable is missing!");
    }
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`✅ MongoDB Connected:`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    // Do not call process.exit(1) on Vercel as it crashes the Serverless Function container immediately.
    if (!process.env.VERCEL) {
      process.exit(1);
    }
  }
};

export default connectDB;
