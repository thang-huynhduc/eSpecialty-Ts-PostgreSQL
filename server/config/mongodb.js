import mongoose from "mongoose";
import dotenv from "dotenv";
const envFile = process.env.NODE_ENV === "production" ? ".env.production" : ".env.development";
dotenv.config({ path: envFile });
const connectString = process.env.MONGO_URI;

const dbConnect = async () => {
  try {
    const conn = await mongoose.connect(connectString);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error in connect MongoDB: ${error.message}`);
    process.exit(1);
  }
};

export default dbConnect;
