import Logo from "@/components/global/logo";
import { ReactNode } from "react";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left Panel */}
      <div className="w-full md:w-1/3 bg-gradient-to-b from-background to-muted p-8 flex flex-col justify-between">
        <div className="mb-8">
          <Logo />
        </div>
        <div className="mb-8">
          <blockquote className="text-xl italic text-foreground/80">
            &ldquo;Boost your Instagram presence with our reliable SMM services. Get real followers, likes, and engagement instantly.&rdquo;
          </blockquote>
          <p className="mt-4 text-muted-foreground">— Trusted by influencers worldwide</p>
        </div>
      </div>

      {/* Right Panel */}
      {children}
    </div>
  );
}
