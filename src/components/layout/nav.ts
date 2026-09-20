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
  FlaskConical,
  Store,
  Users,
  Radio,
  Copy,
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
  { label: "Trade", to: "/trade", icon: Radio },
  { label: "Strategy Lab", to: "/lab", icon: FlaskConical, badge: "NEW" },
  { label: "Strategies", to: "/strategies", icon: Store },
  { label: "Copy Trading", to: "/copy", icon: Copy, badge: "NEW" },
  { label: "Arena", to: "/battle", icon: Swords, badge: "2 LIVE" },
  { label: "AI Strategies", to: "/agents", icon: Bot },
  { label: "Competitions", to: "/tournaments", icon: Trophy },
  { label: "Discover", to: "/discover", icon: Compass },
  { label: "Leaderboard", to: "/leaderboard", icon: Medal },
  { label: "Portfolio", to: "/portfolio", icon: Wallet },
  { label: "ALPHENTRA Wallet", to: "/wallet", icon: Wallet, badge: "ALPH" },
  { label: "AI Copilot", to: "/ai", icon: Sparkles },
];

export const secondaryNav: NavItem[] = [
  { label: "Traders", to: "/traders", icon: Users },
  { label: "Settings", to: "/settings", icon: Settings },
  { label: "Help", to: "/help", icon: LifeBuoy },
  { label: "Profile", to: "/profile", icon: User },
];

export const mobileNav: NavItem[] = [
  { label: "Home", to: "/", icon: Home },
  { label: "Markets", to: "/markets", icon: LineChart },
  { label: "Trade", to: "/trade", icon: Radio },
  { label: "Copy", to: "/copy", icon: Copy },
  { label: "Arena", to: "/battle", icon: Swords },
];
