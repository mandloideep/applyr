import mongoose from "mongoose";
import { env } from "@/config/index.js";

const MAX_RETRIES = 5;
const INITIAL_RETRY_DELAY = 1000; // 1 second

// Connection state for health checks
let isConnected = false;

export const getConnectionState = () => ({
  isConnected,
  readyState: mongoose.connection.readyState,
  readyStateText: getReadyStateText(mongoose.connection.readyState),
});

const getReadyStateText = (state: number): string => {
  switch (state) {
    case 0:
      return "disconnected";
    case 1:
      return "connected";
    case 2:
      return "connecting";
    case 3:
      return "disconnecting";
    default:
      return "unknown";
  }
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const connectDatabase = async (): Promise<typeof mongoose> => {
  let retries = 0;

  while (retries < MAX_RETRIES) {
    try {
      console.log(`Connecting to MongoDB... (attempt ${retries + 1}/${MAX_RETRIES})`);

      const connection = await mongoose.connect(env.MONGO_URI, {
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      });

      isConnected = true;
      console.log("MongoDB connected successfully");

      return connection;
    } catch (error) {
      retries++;
      const delay = INITIAL_RETRY_DELAY * Math.pow(2, retries - 1); // Exponential backoff

      if (retries === MAX_RETRIES) {
        console.error("Failed to connect to MongoDB after maximum retries");
        throw error;
      }

      console.error(
        `MongoDB connection failed (attempt ${retries}/${MAX_RETRIES}). Retrying in ${delay}ms...`,
        error instanceof Error ? error.message : error
      );

      await sleep(delay);
    }
  }

  throw new Error("Failed to connect to MongoDB");
};

export const disconnectDatabase = async (): Promise<void> => {
  if (mongoose.connection.readyState !== 0) {
    console.log("Disconnecting from MongoDB...");
    await mongoose.disconnect();
    isConnected = false;
    console.log("MongoDB disconnected");
  }
};

// Connection event handlers
mongoose.connection.on("connected", () => {
  isConnected = true;
  console.log("MongoDB connection established");
});

mongoose.connection.on("error", (error) => {
  isConnected = false;
  console.error("MongoDB connection error:", error);
});

mongoose.connection.on("disconnected", () => {
  isConnected = false;
  console.log("MongoDB connection disconnected");
});

mongoose.connection.on("reconnected", () => {
  isConnected = true;
  console.log("MongoDB reconnected");
});

// Handle process termination
process.on("SIGINT", async () => {
  await disconnectDatabase();
});

process.on("SIGTERM", async () => {
  await disconnectDatabase();
});
