import mongoose from "mongoose";
import "dotenv/config";
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
