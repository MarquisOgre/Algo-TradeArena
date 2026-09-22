import { createFileRoute } from "@tanstack/react-router";
import { InfoPage } from "@/components/common/InfoPage";

export const Route = createFileRoute("/risk-disclosure")({
  head: () => ({
    meta: [
      { title: "Risk Disclosure — ALPHENTRA" },
      { name: "description", content: "Important risks associated with trading, simulated performance, technology and digital assets." },
    ],
  }),
  component: RiskDisclosurePage,
});

function RiskDisclosurePage() {
  return (
    <InfoPage
      eyebrow="Legal · Risk"
      title="Risk Disclosure"
      description="Trading and strategy development involve significant risks. Read this disclosure before relying on any information, strategy or performance shown through ALPHENTRA."
      sections={[
        {
          title: "No guarantee of results",
          paragraphs: [
            "Past performance, backtests, simulated results, rankings, projected returns and other performance information are not guarantees of future results. A strategy that performs well in historical or simulated conditions can perform differently in live markets.",
          ],
        },
        {
          title: "Market and trading risk",
          bullets: [
            "Financial markets can move rapidly and unpredictably.",
            "Losses can occur, including losses caused by volatility, gaps, liquidity conditions, execution differences and changing market regimes.",
            "Leverage or margin, if introduced or made available through a connected service, can increase both gains and losses.",
            "Transaction costs, spreads, slippage, latency and market-data differences can materially change real-world results.",
          ],
        },
        {
          title: "AI and automated strategy risk",
          paragraphs: [
            "AI-generated strategies and recommendations can be incomplete, incorrect or unsuitable for a particular objective. Automated optimisation can overfit historical data and fail when market conditions change. Users are responsible for independently reviewing strategy logic, assumptions and risk controls before using any strategy.",
          ],
        },
        {
          title: "Technology and connectivity risk",
          bullets: [
            "Software, APIs, market-data feeds, networks and third-party services can experience outages, delays, errors or security incidents.",
            "Displayed prices and simulated fills may differ from prices or execution available in a live market.",
            "No technology platform can eliminate operational, cybersecurity or connectivity risk.",
          ],
        },
        {
          title: "Digital assets and ecosystem features",
          paragraphs: [
            "Digital assets can be highly volatile and may be affected by technological, liquidity, market, regulatory and security risks. Any future ALPHENTRA token or blockchain-related functionality will be subject to the terms, availability and legal requirements applicable at that time.",
          ],
        },
        {
          title: "Independent responsibility",
          paragraphs: [
            "You should consider your own circumstances, risk tolerance and objectives and obtain independent financial, legal or tax advice where appropriate. Nothing on ALPHENTRA is a promise of profit or a substitute for professional advice.",
          ],
        },
      ]}
      notice="The current ALPHENTRA preview is paper trading. The UI may display simulated prices, fills, performance, rankings and rewards. No statement on this page should be interpreted as confirming that live brokerage, custody or regulated investment services are currently available."
    />
  );
}
