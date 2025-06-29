import { createAuthClient } from "better-auth/react";
import { adminClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  plugins: [adminClient()],
  fetchOptions: {
    // Add request deduplication and caching
    cache: "default",
  },
});

export const { signOut, useSession } = authClient;
