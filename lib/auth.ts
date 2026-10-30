import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { emailOTP } from "better-auth/plugins";
import { isEmailCodeConfigured, sendSignInCode } from "./auth-email";
import { getAccountDatabase } from "./postgres";

function createAuth() {
  const secret = process.env.BETTER_AUTH_SECRET;
  if (!secret || secret.length < 32)
    throw new Error("Run npm run setup:local, or configure BETTER_AUTH_SECRET (32+ characters).");
  return betterAuth({
    appName: "Varda",
    database: getAccountDatabase(),
    secret,
    baseURL: process.env.BETTER_AUTH_URL,
    trustedOrigins:
      process.env.NODE_ENV === "production"
        ? []
        : ["http://localhost:3000", "http://127.0.0.1:3000"],
    emailAndPassword: { enabled: true, minPasswordLength: 10 },
    session: { cookieCache: { enabled: true, maxAge: 300 } },
    rateLimit: {
      enabled: true,
      storage: "database",
      customRules: {
        "/email-otp/send-verification-otp": { window: 60, max: 3 },
        "/sign-in/email-otp": { window: 60, max: 6 },
      },
    },
    plugins: [
      ...(isEmailCodeConfigured()
        ? [
            emailOTP({
              otpLength: 6,
              expiresIn: 300,
              allowedAttempts: 3,
              storeOTP: "hashed",
              async sendVerificationOTP({ email, otp, type }) {
                await sendSignInCode(email, otp, type);
              },
            }),
          ]
        : []),
      nextCookies(),
    ],
  });
}

const globalAuth = globalThis as unknown as { vardaAuth?: ReturnType<typeof createAuth> };
export function getAuth() {
  return (globalAuth.vardaAuth ??= createAuth());
}
