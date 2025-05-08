import { SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import Wallet from "./wallet";
import CurrencyForm from "./select-currency";

export default function Header() {
  return (
    <header className="w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-5">
      <div className="flex h-14 max-w-screen-2xl items-center">
        <SidebarTrigger className="block md:hidden" />
        <div className="flex flex-1 items-center justify-between gap-5 md:justify-end">
          <div className="h-full w-fit flex items-center justify-center gap-5">
            <Wallet />
            <CurrencyForm />
          </div>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
