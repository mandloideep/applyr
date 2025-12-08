import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { emailOTP } from "better-auth/plugins";
import mongoose from "mongoose";
import { Resend } from "resend";
import { env } from "@/config/index";
import { logger } from "@/shared/utils/index";

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

const sendEmail = async (to: string, subject: string, html: string) => {
  if (!resend) {
    logger.warn("Email sending skipped - RESEND_API_KEY not configured", { to, subject });
    return;
  }
  await resend.emails.send({
    from: "Applyr <noreply@applyr.dev>",
    to,
    subject,
    html,
  });
};

// Lazy initialization - auth instance is created after database connects
let authInstance: ReturnType<typeof betterAuth> | null = null;

export const getAuth = () => {
  if (!authInstance) {
    throw new Error("Auth not initialized. Call initAuth() after database connection.");
  }
  return authInstance;
};

export const initAuth = () => {
  if (authInstance) {
    return authInstance;
  }

  authInstance = betterAuth({
    database: mongodbAdapter(mongoose.connection.getClient().db()),
    baseURL: env.BETTER_AUTH_URL,
    secret: env.BETTER_AUTH_SECRET,
    trustedOrigins: env.CORS_ORIGINS,

    // Email/Password authentication
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: true,
    },

    // Email verification
    emailVerification: {
      sendVerificationEmail: async ({ user, url }) => {
        try {
          await sendEmail(
            user.email,
            "Verify your email address",
            `
              <h1>Welcome to Applyr!</h1>
              <p>Please verify your email address by clicking the link below:</p>
              <a href="${url}">Verify Email</a>
              <p>If you didn't create an account, you can safely ignore this email.</p>
            `
          );
          logger.info("Verification email sent", { email: user.email });
        } catch (error) {
          logger.error("Failed to send verification email", { email: user.email, error });
          throw error;
        }
      },
      sendOnSignUp: true,
    },

    // Session configuration
    session: {
      cookieCache: {
        enabled: true,
        maxAge: 60 * 5, // 5 minutes
      },
      expiresIn: 60 * 60 * 24 * 7, // 7 days
      updateAge: 60 * 60 * 24, // 1 day
    },

    // Plugins
    plugins: [
      emailOTP({
        async sendVerificationOTP({ email, otp, type }) {
          try {
            let subject: string;
            let html: string;

            if (type === "sign-in") {
              subject = "Your Applyr login code";
              html = `
                <h1>Your login code</h1>
                <p>Enter this code to sign in to your Applyr account:</p>
                <h2 style="font-size: 32px; letter-spacing: 4px;">${otp}</h2>
                <p>This code expires in 10 minutes.</p>
                <p>If you didn't request this code, you can safely ignore this email.</p>
              `;
            } else if (type === "email-verification") {
              subject = "Verify your Applyr email";
              html = `
                <h1>Verify your email</h1>
                <p>Enter this code to verify your email address:</p>
                <h2 style="font-size: 32px; letter-spacing: 4px;">${otp}</h2>
                <p>This code expires in 10 minutes.</p>
              `;
            } else {
              subject = "Reset your Applyr password";
              html = `
                <h1>Password reset code</h1>
                <p>Enter this code to reset your password:</p>
                <h2 style="font-size: 32px; letter-spacing: 4px;">${otp}</h2>
                <p>This code expires in 10 minutes.</p>
                <p>If you didn't request a password reset, you can safely ignore this email.</p>
              `;
            }

            await sendEmail(email, subject, html);
            logger.info("OTP email sent", { email, type });
          } catch (error) {
            logger.error("Failed to send OTP email", { email, type, error });
            throw error;
          }
        },
        otpLength: 6,
        expiresIn: 600, // 10 minutes
        sendVerificationOnSignUp: false, // Use email verification link instead
      }),
    ],
  });

  logger.info("Better Auth initialized");
  return authInstance;
};

export type Auth = ReturnType<typeof betterAuth>;
