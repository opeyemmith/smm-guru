import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin, createAuthMiddleware } from "better-auth/plugins";
import { db } from "../database/db";
import { allSchemas } from "@smm-guru/database";
import {
  AUTH_DELIVERY_EMAIL,
  GITHUB_CLIENT_ID,
  GITHUB_CLIENT_SECRET,
  PROJECT_NAME,
} from "../env";
import ForgotPasswordEmail from "../../../email/forget-password.email";
import resend from "../resend/config.resend";
import { eq } from "@smm-guru/database";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg", // or "pg" or "mysql"
    schema: {
      ...allSchemas,
    },
  }),
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    sendResetPassword: async ({ user, url }) => {
      const { error } = await resend.emails.send({
        from: `${PROJECT_NAME} <${AUTH_DELIVERY_EMAIL}>`,
        to: user.email,
        subject: "Reset your password",
        react: ForgotPasswordEmail({
          email: user.email,
          link: url,
          projectName: PROJECT_NAME,
        }),
      });

      if (error?.message) {
        console.log("Error in sending Email: ", error);

        throw new Error(error.message);
      }
    },
  },
  socialProviders: {
    github: {
      clientId: GITHUB_CLIENT_ID,
      clientSecret: GITHUB_CLIENT_SECRET,
    },
  },
  hooks: {
    after: createAuthMiddleware(async (c) => {
      const newSession = c.context.newSession;
      const user = newSession?.user;

      if (newSession && user) {
        try {
          const isWalletAvail = await db.query.wallet.findFirst({
            where: eq(allSchemas.wallet.userId, user.id),
          });

          if (isWalletAvail) {
            return;
          }

          await db.insert(allSchemas.wallet).values({
            userId: user.id,
          });
        } catch (error) {
          console.error("Error while creating wallet in after hook:", error);

          throw c.redirect("/sign-in");
        }
      }
    }),
  },
  plugins: [admin(), nextCookies()], // make sure this is the last plugin in the array
});
