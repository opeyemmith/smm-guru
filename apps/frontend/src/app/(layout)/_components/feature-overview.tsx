"use client";

import React, { useRef, useEffect, useState } from "react";
import { landingPageContent } from "@/lib/constants/hero.constants";

export const FeatureOverview = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [features, setFeatures] = useState(
    landingPageContent.featuresPreview.features
  );
  const scrollSpeed = 1;
  const gap = 48;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let animationFrameId: number;
    let currentScroll = 0;

    const scroll = () => {
      if (!container) return;

      currentScroll += scrollSpeed;

      // Check if we've reached the end of the scrollable area
      if (currentScroll > container.scrollWidth - container.clientWidth) {
        // Reset scroll and append the initial features to create the loop
        currentScroll = 0;
        setFeatures((prevFeatures) => [
          ...prevFeatures,
          ...landingPageContent.featuresPreview.features,
        ]);
      }

      container.scrollLeft = currentScroll;
      animationFrameId = requestAnimationFrame(scroll);
    };

    animationFrameId = requestAnimationFrame(scroll);

    // Pause on hover
    const pauseOnHover = () => {
      cancelAnimationFrame(animationFrameId);
    };

    const resumeScroll = () => {
      animationFrameId = requestAnimationFrame(scroll);
    };

    container.addEventListener("mouseenter", pauseOnHover);
    container.addEventListener("mouseleave", resumeScroll);

    return () => {
      cancelAnimationFrame(animationFrameId);
      container.removeEventListener("mouseenter", pauseOnHover);
      container.removeEventListener("mouseleave", resumeScroll);
    };
  }, [scrollSpeed]);

  return (
    <section id="sponsors" className="max-w-[75%] mx-auto pb-24 sm:pb-32">
      <div
        className="mx-auto overflow-hidden relative"
        style={{ scrollBehavior: "smooth" }}
      >
        <div
          ref={containerRef}
          className="flex whitespace-nowrap py-4"
          style={{ gap: `${gap}px`, overflowX: "hidden" }}
        >
          {features.map(({ icon, text }, index) => (
            <div
              key={`${text}-${index}`} // Unique key for each element, including clones
              className="flex items-center text-xl md:text-2xl gap-2 font-medium"
            >
              <span>{icon}</span>
              <span>{text}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
