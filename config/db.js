import mongoose from "mongoose";

const connectDB = async () => {
  try {
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
