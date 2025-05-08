"use client";

import { ReactNode } from "react";
import QueryProviders from "./query-provider";

const Provider = ({ children }: { children: ReactNode }) => {
  return <QueryProviders>{children}</QueryProviders>;
};

export default Provider;
