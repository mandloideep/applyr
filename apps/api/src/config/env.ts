import { z } from "zod";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Load .env from project root (works for both local dev and monorepo structure)
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "../../../../");
dotenv.config({ path: path.join(rootDir, ".env") });

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(5677),
  MONGO_URI: z.string().min(1, "MONGO_URI is required"),
  SESSION_SECRET: z.string().min(32, "SESSION_SECRET must be at least 32 characters"),
  CORS_ORIGINS: z
    .string()
    .default("http://localhost:3000,http://localhost:5173")
    .transform((val) => val.split(",").map((origin) => origin.trim())),
  LOG_LEVEL: z.enum(["error", "warn", "info", "http", "debug"]).default("info"),
  BETTER_AUTH_SECRET: z.string().min(32, "BETTER_AUTH_SECRET must be at least 32 characters"),
  BETTER_AUTH_URL: z.url({ message: "BETTER_AUTH_URL must be a valid URL" }),
  RESEND_API_KEY: z.string().optional(), // Required for email sending, but optional for local dev
});

const parseEnv = () => {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error("Environment validation failed:");
    console.error(
      result.error.issues.map((issue) => `- ${issue.path.join(".")}: ${issue.message}`).join("\n")
    );
    process.exit(1);
  }

  return result.data;
};

export const env = parseEnv();

export type Env = z.infer<typeof envSchema>;
