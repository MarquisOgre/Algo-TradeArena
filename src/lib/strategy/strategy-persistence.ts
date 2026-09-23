import { supabase } from "@/lib/supabase";

export type PersistedStrategy = { strategyId: string; versionId: string };

const slugify = (value: string) =>
  value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48) || "strategy";

export async function ensurePersistedStrategy(input: {
  name: string;
  description: string;
  definition: Record<string, unknown>;
}): Promise<PersistedStrategy> {
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  if (!authData.user) throw new Error("You must be signed in to save a Strategy Lab backtest.");

  const { data: trader, error: traderLookupError } = await supabase
    .from("traders")
    .select("id")
    .eq("profile_id", authData.user.id)
    .maybeSingle();
  if (traderLookupError) throw traderLookupError;

  let traderId = trader?.id as string | undefined;
  if (!traderId) {
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("display_name, username")
      .eq("id", authData.user.id)
      .single();
    if (profileError) throw profileError;

    const baseSlug = slugify(profile.username || input.name);
    const { data: createdTrader, error: traderError } = await supabase
      .from("traders")
      .insert({
        profile_id: authData.user.id,
        display_name: profile.display_name || profile.username || "ALPHENTRA Trader",
        public_slug: `${baseSlug}-${authData.user.id.slice(0, 8)}`,
        is_public: false,
      })
      .select("id")
      .single();
    if (traderError) throw traderError;
    traderId = createdTrader.id;
  }

  const strategySlug = `${slugify(input.name)}-${Date.now().toString(36)}`;
  const { data: strategy, error: strategyError } = await supabase
    .from("strategies")
    .insert({
      trader_id: traderId,
      name: input.name.trim() || "Untitled Strategy",
      slug: strategySlug,
      short_description: "Strategy created in ALPHENTRA Strategy Lab.",
      description: input.description,
      strategy_type: "algorithmic",
      market_type: "multi_asset",
      status: "draft",
      visibility: "private",
      is_marketplace_listed: false,
      is_copy_tradable: false,
    })
    .select("id")
    .single();
  if (strategyError) throw strategyError;

  const { data: version, error: versionError } = await supabase
    .from("strategy_versions")
    .insert({
      strategy_id: strategy.id,
      version_number: 1,
      version_label: "Strategy Lab v1",
      definition: input.definition,
      parameters: {},
      changelog: "Created from ALPHENTRA Strategy Lab.",
      is_live: false,
    })
    .select("id")
    .single();
  if (versionError) throw versionError;

  return { strategyId: strategy.id, versionId: version.id };
}
