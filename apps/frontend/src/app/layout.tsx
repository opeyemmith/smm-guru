import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";
import { ThemeProvider } from "@/components/ui/theme-provider";
import Provider from "@/context/provider";
import { Toaster } from "@/components/ui/sonner";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "SMM Panel - Social Media Marketing Services",
  description:
    "Premium social media marketing panel offering high-quality services for all major platforms. Boost your social media presence with instant likes, followers, and engagement.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body
        className={cn(
          outfit.variable,
          "antialiased",
          process.env.NODE_ENV !== "production" && "debug-screens"
        )}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Provider>{children}</Provider>
          <Toaster closeButton={true} position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
