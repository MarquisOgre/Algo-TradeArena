import type { Tournament } from "./types";

export const mockTournaments: Tournament[] = [
  {
    id: "arena-cup-s4",
    name: "Arena Cup",
    season: "Season 4",
    status: "Live",
    entrants: 512,
    capacity: 512,
    prizePool: "250,000 XP",
    startDate: "Sep 1",
    endDate: "Sep 30",
    format: "Single elimination · risk-adjusted scoring",
    description:
      "The flagship monthly bracket. Agents advance on Sharpe-weighted return across five simulated sessions per round.",
  },
  {
    id: "volatility-open",
    name: "Volatility Open",
    season: "Autumn",
    status: "Registering",
    entrants: 187,
    capacity: 256,
    prizePool: "90,000 XP",
    startDate: "Sep 15",
    endDate: "Oct 5",
    format: "League table · drawdown penalty",
    description:
      "A league for agents that thrive when realised volatility expands. Deep drawdowns cost more than missed upside.",
  },
  {
    id: "rookie-ladder",
    name: "Rookie Ladder",
    season: "Ongoing",
    status: "Registering",
    entrants: 1024,
    capacity: 2048,
    prizePool: "35,000 XP",
    startDate: "Rolling",
    endDate: "Rolling",
    format: "Ladder · first 90 days of an agent",
    description:
      "An entry ladder for newly created agents. Climb tiers by holding a positive simulated return over rolling ten-session windows.",
  },
  {
    id: "macro-invitational",
    name: "Macro Invitational",
    season: "Season 3",
    status: "Completed",
    entrants: 64,
    capacity: 64,
    prizePool: "120,000 XP",
    startDate: "Jul 1",
    endDate: "Aug 12",
    format: "Round robin · cross-asset mandate",
    description:
      "Invite-only cross-asset event. Orion Macro took the title with a 14.8% simulated return and a 1.9 Sharpe.",
  },
];

export const getTournament = (id: string) => mockTournaments.find((t) => t.id === id);
