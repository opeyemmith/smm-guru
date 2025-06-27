"use client";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { landingPageContent } from "@/lib/constants/hero.constants";
import { cn } from "@/lib/utils";
import { ArrowRight } from "lucide-react";
import { useTheme } from "next-themes";
import Link from "next/link";

export const HeroSection = () => {
  const { theme } = useTheme();
  return (
    <section className="container w-full">
      <div className="grid place-items-center lg:max-w-screen-xl gap-8 mx-auto py-20 md:py-32">
        <div className="text-center space-y-8">
          <Badge variant="outline" className="text-sm py-2 rounded-lg">
            <span> {landingPageContent.heroSection.trialText} </span>
          </Badge>

          <div className="max-w-screen-md mx-auto text-center text-4xl md:text-6xl font-bold">
            <h1>{landingPageContent.heroSection.title}</h1>
          </div>

          <p className="max-w-screen-sm mx-auto text-xl text-muted-foreground">
            {landingPageContent.heroSection.subtitle}
          </p>

          <div className="space-y-4 md:space-y-0 md:space-x-4">
            <Link
              href="/sign-in"
              className={cn(
                buttonVariants({
                  className: "w-5/6 md:w-1/4 font-bold group/arrow",
                })
              )}
            >
              {landingPageContent.heroSection.ctaButton}
              <ArrowRight className="size-5 ml-2 group-hover/arrow:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>

        <div className="relative group mt-14">
          <div className="absolute top-2 lg:-top-8 left-1/2 transform -translate-x-1/2 w-[90%] mx-auto h-24 lg:h-80 bg-primary/50 rounded-full blur-3xl"></div>
          
          {/* Dashboard Preview Mockup */}
          <div 
            className={cn(
              "w-full md:w-[1200px] h-[656px] mx-auto rounded-lg relative border border-t-2 border-secondary border-t-primary/30 overflow-hidden",
              theme === "light" ? "bg-gray-50" : "bg-gray-900"
            )}
          >
            {/* Header */}
            <div className={cn(
              "h-12 px-4 flex items-center border-b",
              theme === "light" ? "bg-white border-gray-200" : "bg-gray-800 border-gray-700"
            )}>
              <div className="flex space-x-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
              </div>
              <div className={cn(
                "mx-auto px-4 py-1 rounded-md text-sm",
                theme === "light" ? "bg-gray-100" : "bg-gray-700"
              )}>
                SMM Guru Dashboard
              </div>
            </div>
            
            {/* Sidebar */}
            <div className="flex h-[calc(100%-3rem)]">
              <div className={cn(
                "w-48 p-4 border-r",
                theme === "light" ? "bg-gray-100 border-gray-200" : "bg-gray-800 border-gray-700"
              )}>
                <div className="space-y-2">
                  {['Dashboard', 'New Order', 'Orders', 'Services', 'API', 'Wallet'].map((item) => (
                    <div key={item} className={cn(
                      "px-3 py-2 rounded-md text-sm",
                      item === 'Dashboard' 
                        ? theme === "light" 
                          ? "bg-primary text-primary-foreground" 
                          : "bg-primary text-primary-foreground"
                        : theme === "light" 
                          ? "hover:bg-gray-200" 
                          : "hover:bg-gray-700"
                    )}>
                      {item}
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Main Content */}
              <div className="flex-1 p-6">
                <div className="grid grid-cols-3 gap-6 mb-6">
                  {[
                    { title: 'Balance', value: '$250.00', color: 'bg-blue-100 dark:bg-blue-900' },
                    { title: 'Total Orders', value: '152', color: 'bg-green-100 dark:bg-green-900' },
                    { title: 'Completed', value: '137', color: 'bg-purple-100 dark:bg-purple-900' }
                  ].map((card, i) => (
                    <div key={i} className={cn(
                      "p-4 rounded-lg border",
                      theme === "light" 
                        ? `${card.color} border-gray-200` 
                        : `${card.color} border-gray-700`
                    )}>
                      <div className="text-sm font-medium text-gray-500 dark:text-gray-400">{card.title}</div>
                      <div className="text-2xl font-bold mt-1">{card.value}</div>
                    </div>
                  ))}
                </div>
                
                <div className={cn(
                  "rounded-lg border p-4 mb-6",
                  theme === "light" ? "bg-white border-gray-200" : "bg-gray-800 border-gray-700"
                )}>
                  <div className="font-medium mb-3">Recent Orders</div>
                  <div className="space-y-2">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className={cn(
                        "flex items-center justify-between py-2 px-3 rounded-md text-sm",
                        theme === "light" ? "bg-gray-50" : "bg-gray-700"
                      )}>
                        <div>Order #{1000 + i}</div>
                        <div className={cn(
                          "px-2 py-1 rounded text-xs",
                          i % 3 === 0 
                            ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                            : i % 2 === 0 
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                              : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                        )}>
                          {i % 3 === 0 ? 'Pending' : i % 2 === 0 ? 'Completed' : 'Processing'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="absolute bottom-0 left-0 w-full h-20 md:h-28 bg-gradient-to-b from-background/0 via-background/50 to-background rounded-lg"></div>
        </div>
      </div>
    </section>
  );
};
