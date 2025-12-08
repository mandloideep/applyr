import { env } from "@/config/index.js";
import { connectDatabase, disconnectDatabase } from "@/db/connection.js";
import { createApp } from "./app.js";
import { logger } from "@/shared/utils/index.js";
import { handleUncaughtException, handleUnhandledRejection } from "@/shared/middlewares/index.js";

// Handle uncaught exceptions and unhandled rejections
process.on("uncaughtException", handleUncaughtException);
process.on("unhandledRejection", handleUnhandledRejection);

const startServer = async () => {
  try {
    // Connect to database first
    await connectDatabase();

    // Create Express app
    const app = createApp();

    // Start server
    const server = app.listen(env.PORT, () => {
      logger.info(`Server running on port ${env.PORT} in ${env.NODE_ENV} mode`);
    });

    // Graceful shutdown handling
    const shutdown = async (signal: string) => {
      logger.info(`${signal} received. Shutting down gracefully...`);

      // Close server first (stop accepting new connections)
      server.close(async () => {
        logger.info("Server closed");

        // Then disconnect from database
        await disconnectDatabase();

        process.exit(0);
      });

      // Force close after 10 seconds
      setTimeout(() => {
        logger.error("Could not close connections in time, forcefully shutting down");
        process.exit(1);
      }, 10000);
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));
  } catch (error) {
    logger.error("Failed to start server", { error });
    process.exit(1);
  }
};

startServer();
