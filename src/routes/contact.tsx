import { createFileRoute } from "@tanstack/react-router";
import { InfoPage } from "@/components/common/InfoPage";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — ALPHENTRA" },
      { name: "description", content: "Contact ALPHENTRA for platform support, product questions and partnership enquiries." },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  return (
    <InfoPage
      eyebrow="Contact"
      title="Let's talk about ALPHENTRA."
      description="Use the available platform support channel for questions about the product, your account or the current preview."
      sections={[
        {
          title: "Platform support",
          paragraphs: [
            "For account, authentication, platform or feature questions, start with the ALPHENTRA Help Center. It contains the current product guidance and answers for the paper-trading preview.",
          ],
        },
        {
          title: "Product and partnership enquiries",
          paragraphs: [
            "For product feedback, strategic partnerships or business enquiries, please use the same support channel and clearly identify the purpose of your message so it can be routed appropriately.",
          ],
        },
        {
          title: "What to include",
          bullets: [
            "The feature or page you are asking about.",
            "A short description of the issue or request.",
            "Relevant screenshots or error messages where useful.",
            "Your account email only when it is necessary to resolve an account-specific issue.",
          ],
        },
      ]}
    />
  );
}
