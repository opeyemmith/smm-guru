import { Navbar } from "./_components/navbar";
import { ReactNode } from "react";

const Layout = ({ children }: { children: ReactNode }) => {
  return (
    <main className="px-5">
      <Navbar />

      {children}
    </main>
  );
};

export default Layout;
