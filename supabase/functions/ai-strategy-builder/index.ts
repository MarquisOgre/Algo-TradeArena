import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "AI Strategy Builder is not configured. Add OPENAI_API_KEY to the Supabase function secrets." }), {
        status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Authentication required." }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const prompt = String(body.prompt ?? "").trim();
    if (!prompt) {
      return new Response(JSON.stringify({ error: "A strategy description is required." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const system = [
      "You are the ALPHENTRA Strategy Builder.",
      "Convert a user's natural-language trading idea into a conservative, testable structured strategy definition.",
      "Never promise profitability. Return rules that can be objectively backtested.",
      "Use only indicators EMA, SMA, RSI, MACD, ATR, PRICE, OPEN, HIGH, LOW, VOLUME.",
      "Use comparators gt, gte, lt, lte, eq, neq, crosses_above, crosses_below.",
      "Return JSON only with entryOperator, entry, exitOperator, exit, stopLossPct, takeProfitPct, trailingStopPct, riskPerTradePct, positionSizing.",
      "Each condition must have indicator, optional period, comparator and value.",
      "Risk per trade must be >0 and <=2. Stop loss must be >=0 and <=10. Take profit must be >=0 and <=20.",
      "Do not invent market symbols or hardcode a universe.",
    ].join(" ");

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: Deno.env.get("OPENAI_STRATEGY_MODEL") ?? "gpt-4.1-mini",
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [{ role: "system", content: system }, { role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const detail = await response.text();
      return new Response(JSON.stringify({ error: "AI provider request failed.", detail }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payload = await response.json();
    const content = payload?.choices?.[0]?.message?.content;
    if (!content) throw new Error("AI provider returned no strategy definition.");

    const definition = JSON.parse(content);
    return new Response(JSON.stringify({ definition }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "AI strategy generation failed." }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});