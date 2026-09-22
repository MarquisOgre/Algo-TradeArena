import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { InfoPage } from "@/components/common/InfoPage";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — ALPHENTRA" },
      { name: "description", content: "Learn what ALPHENTRA is building for traders, creators and investors." },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <InfoPage
      eyebrow="About ALPHENTRA"
      title="A global trading ecosystem, built around better decisions."
      description="ALPHENTRA brings markets, strategy creation, discovery, copy trading and competition into one connected platform."
      sections={[
        {
          title: "What is ALPHENTRA?",
          paragraphs: [
            "ALPHENTRA is a trading technology platform focused on giving users one place to explore markets, build and test strategies, discover other traders and participate in competitive trading experiences.",
            "The current platform is a product preview and paper-trading environment. Market prices, positions, strategy results, rankings and rewards shown in the preview are simulated unless explicitly stated otherwise.",
          ],
        },
        {
          title: "What we are building",
          bullets: [
            "Market access and a unified trading workspace.",
            "AI-assisted strategy creation, backtesting and optimisation.",
            "A strategy marketplace for discovery and subscription workflows.",
            "Copy trading tools that let users follow selected traders.",
            "Arena and competition experiences with transparent rules and simulated rewards during the preview stage.",
            "An ALPHENTRA ecosystem designed to connect traders, creators and innovators.",
          ],
        },
        {
          title: "Our approach",
          paragraphs: [
            "We are building ALPHENTRA in stages, validating the product experience before introducing live-money functionality. Features may change as the platform evolves, and availability can vary by jurisdiction and product stage.",
          ],
        },
      ]}
      notice="ALPHENTRA is currently presented as a prototype/paper-trading platform. This page describes the product direction and should not be read as a statement that live brokerage, custody or regulated investment services are currently available."
    />
    
  );
}
