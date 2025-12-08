import { env } from "@/config/index.js";
import { connectDatabase, disconnectDatabase } from "@/db/connection.js";
import { createApp } from "./app.js";

const startServer = async () => {
  try {
    // Connect to database first
    await connectDatabase();

    // Create Express app
    const app = createApp();

    // Start server
    const server = app.listen(env.PORT, () => {
      console.log(`Server running on port ${env.PORT} in ${env.NODE_ENV} mode`);
    });

    // Graceful shutdown handling
    const shutdown = async (signal: string) => {
      console.log(`${signal} received. Shutting down gracefully...`);

      // Close server first (stop accepting new connections)
      server.close(async () => {
        console.log("Server closed");

        // Then disconnect from database
        await disconnectDatabase();

        process.exit(0);
      });

      // Force close after 10 seconds
      setTimeout(() => {
        console.error("Could not close connections in time, forcefully shutting down");
        process.exit(1);
      }, 10000);
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
