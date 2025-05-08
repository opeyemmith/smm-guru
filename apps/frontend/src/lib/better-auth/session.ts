"use server";

import { headers } from "next/headers";
import { auth } from "./auth";
import { Session } from "./type.auth";

/**
 * Retrieves the current session from the authentication API.
 *
 * @returns {Promise<Session | null>} A promise that resolves to the current session if available, or null if an error occurs.
 *
 * @throws Will log an error message to the console if the session retrieval fails.
 */
export const getServerSession = async (): Promise<Session | null> => {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    return session;
  } catch (err) {
    console.log("Error in getting server session: ", err);

    return null;
  }
};

export const getMiddlewareSession = async () => {
  // const session = await auth.api.getSession({
  //   headers: await headers(),
  // });

  // return session;

  return true
};
