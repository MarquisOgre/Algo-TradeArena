import { createFileRoute } from "@tanstack/react-router";
import { LandingPage } from "@/components/landing/LandingPage";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ALPHENTRA — Trade Beyond Limits" },
      {
        name: "description",
        content: "The all-in-one trading ecosystem for traders, creators and investors.",
      },
      { property: "og:title", content: "ALPHENTRA — Trade Beyond Limits" },
      {
        property: "og:description",
        content: "Build strategies, trade global markets, copy top traders, compete and earn.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LandingPage,
});
