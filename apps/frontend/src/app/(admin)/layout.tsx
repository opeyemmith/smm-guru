import React, { ReactNode } from "react";
import { AdminNavLinks } from "./_components/admin-navlinks";

const Layout = ({ children }: { children: ReactNode }) => {
  return (
    <main className="w-full min-h-screen flex flex-col items-start justify-start gap-3 px-6">
      <header className="w-full py-3 border-b border-border">
        <h2>Admin Panel</h2>
        <AdminNavLinks />
      </header>
      {children}
    </main>
  );
};

export default Layout;
