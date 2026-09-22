import { createFileRoute } from "@tanstack/react-router";
import { InfoPage } from "@/components/common/InfoPage";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms & Conditions — ALPHENTRA" },
      { name: "description", content: "Terms governing access to and use of the ALPHENTRA platform." },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <InfoPage
      eyebrow="Legal · Terms"
      title="Terms & Conditions"
      description="These terms describe the general conditions for using the ALPHENTRA platform and its current preview features."
      sections={[
        {
          title: "1. Acceptance",
          paragraphs: [
            "By accessing or using ALPHENTRA, you agree to use the platform in accordance with these terms and applicable law. If you do not agree, you should not use the platform.",
          ],
        },
        {
          title: "2. The current service",
          paragraphs: [
            "The current ALPHENTRA preview is a paper-trading and product-development environment. Features, data sources, simulated balances, performance calculations, competition rules and other functionality may change without notice.",
          ],
        },
        {
          title: "3. Permitted use",
          bullets: [
            "Use the platform only for lawful purposes.",
            "Do not attempt to disrupt, reverse engineer, abuse or gain unauthorised access to the platform or another user's account.",
            "Do not submit content or data that you do not have the right to use.",
            "Do not represent simulated results as verified live trading performance.",
          ],
        },
        {
          title: "4. Accounts and security",
          paragraphs: [
            "Where an account is required, you are responsible for maintaining the confidentiality of your credentials and for activity performed through your account. Notify ALPHENTRA promptly if you believe your account has been compromised.",
          ],
        },
        {
          title: "5. Strategies and content",
          paragraphs: [
            "Strategies, trader profiles, AI outputs, educational material and other platform content are provided for informational and product-use purposes. Users remain responsible for reviewing and independently validating any strategy before relying on it.",
          ],
        },
        {
          title: "6. Availability and third parties",
          paragraphs: [
            "ALPHENTRA may depend on third-party infrastructure, market-data providers, authentication services and other integrations. We do not guarantee uninterrupted availability or the accuracy, completeness or timeliness of third-party information.",
          ],
        },
        {
          title: "7. No investment advice",
          paragraphs: [
            "Nothing on ALPHENTRA constitutes investment, financial, legal or tax advice, or a recommendation to buy, sell or hold any asset. Any future live-trading functionality will be subject to additional terms and applicable requirements.",
          ],
        },
        {
          title: "8. Changes and termination",
          paragraphs: [
            "We may modify, suspend or discontinue features as the platform evolves. We may restrict access where reasonably necessary for security, abuse prevention, legal compliance or platform integrity.",
          ],
        },
        {
          title: "9. Governing terms",
          paragraphs: [
            "The final production terms will identify the contracting entity, governing law, dispute process and jurisdiction applicable to the service. Those details should be completed before production launch and reviewed by qualified counsel.",
          ],
        },
      ]}
      notice="This page is a product-stage terms draft for the current ALPHENTRA preview. The final production version should be reviewed and approved by qualified legal counsel and should identify the correct legal entity, jurisdiction and regulatory framework."
    />
  );
}
