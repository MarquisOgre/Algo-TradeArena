import { createFileRoute } from "@tanstack/react-router";
import { LandingPage } from "@/components/landing/LandingPage";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ALPHENTRA — Trade Beyond Limits" },
      {
        name: "description",
        content:
          "Alphentra is a global AI-powered trading ecosystem for traders, creators and investors.",
      },
      { property: "og:title", content: "ALPHENTRA — Trade Beyond Limits" },
      {
        property: "og:description",
        content:
          "Build strategies, test ideas, trade global markets, copy top traders and compete in the Arena.",
      },
    ],
  }),
  component: LandingPage,
});
