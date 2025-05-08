import Logo from "@/components/global/logo";
import { Separator } from "@/components/ui/separator";
import { landingPageContent, legalPages } from "@/lib/constants/hero.constants";
import Link from "next/link";

export const FooterSection = () => {
  return (
    <footer id="footer" className="container py-24 sm:py-32">
      <div className="p-10 bg-card border border-secondary rounded-2xl">
        <div className="w-full h-fit flex items-center justify-between">
          <div className="col-span-full xl:col-span-2">
            <Logo />
          </div>

          <div className="flex flex-col gap-2 mr-5">
            <h3 className="font-bold text-lg">Policies</h3>

            {legalPages.map((page, i) => (
              <div key={i}>
                <Link
                  href={page.slug}
                  className="opacity-60 transition-all duration-300 ease-in-out hover:opacity-100 hover:text-primary hover:translate-x-1"
                >
                  {page.title}
                </Link>
              </div>
            ))}
          </div>
        </div>

        <Separator className="my-6" />
        <section className="">
          <h3 className="">{landingPageContent.footerSection.copyrightText}</h3>
        </section>
      </div>
    </footer>
  );
};
