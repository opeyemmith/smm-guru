import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { landingPageContent } from "@/lib/constants/hero.constants";

export const WhySection = () => {
  return (
    <section id="why" className="container py-24 sm:py-32">
      <div className="grid lg:grid-cols-2 place-items-center lg:gap-24">
        <div>
          <h2 className="text-lg text-primary mb-2 tracking-wider">Why</h2>

          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {landingPageContent.benefitsSection.title}
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            {landingPageContent.benefitsSection.description}
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-4 w-full">
          {landingPageContent.benefitsSection.benefitsList.map(
            ({ icon, title, description }, index) => (
              <Card
                key={title}
                className="bg-muted/50 dark:bg-card hover:bg-background transition-all delay-75 group/number"
              >
                <CardHeader>
                  <div className="flex justify-between">
                    {icon}
                    <span className="text-5xl text-muted-foreground/15 font-medium transition-all delay-75 group-hover/number:text-muted-foreground/30">
                      0{index + 1}
                    </span>
                  </div>

                  <CardTitle>{title}</CardTitle>
                </CardHeader>

                <CardContent className="text-muted-foreground">
                  {description}
                </CardContent>
              </Card>
            )
          )}
        </div>
      </div>
    </section>
  );
};
