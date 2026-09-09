import {
  Home,
  LineChart,
  Swords,
  Bot,
  Trophy,
  Compass,
  Medal,
  Wallet,
  Sparkles,
  Settings,
  LifeBuoy,
  User,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
  badge?: string;
}

export const primaryNav: NavItem[] = [
  { label: "Home", to: "/", icon: Home },
  { label: "Markets", to: "/markets", icon: LineChart },
  { label: "Battle Arena", to: "/battle", icon: Swords, badge: "2 LIVE" },
  { label: "AI Agents", to: "/agents", icon: Bot },
  { label: "Tournaments", to: "/tournaments", icon: Trophy },
  { label: "Discover", to: "/discover", icon: Compass },
  { label: "Leaderboard", to: "/leaderboard", icon: Medal },
  { label: "Portfolio", to: "/portfolio", icon: Wallet },
  { label: "AI Copilot", to: "/ai", icon: Sparkles },
];

export const secondaryNav: NavItem[] = [
  { label: "Settings", to: "/settings", icon: Settings },
  { label: "Help", to: "/help", icon: LifeBuoy },
  { label: "Profile", to: "/profile", icon: User },
];

export const mobileNav: NavItem[] = [
  { label: "Home", to: "/", icon: Home },
  { label: "Markets", to: "/markets", icon: LineChart },
  { label: "Battle", to: "/battle", icon: Swords },
  { label: "Agents", to: "/agents", icon: Bot },
  { label: "Portfolio", to: "/portfolio", icon: Wallet },
];
