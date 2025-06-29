"use client";

import { ReactNode } from "react";
import QueryProviders from "./query-provider";
import { SessionProvider } from "./session-provider";

const Provider = ({ children }: { children: ReactNode }) => {
  return (
    <QueryProviders>
      <SessionProvider>
        {children}
      </SessionProvider>
    </QueryProviders>
  );
};

export default Provider;
