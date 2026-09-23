import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const AI_TIMEOUT_MS = 30_000;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const apiKey = Deno.env.get("OPENROUTER_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "AI Strategy Builder is not configured. Add OPENROUTER_API_KEY to the Supabase function secrets." }), {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Authentication required." }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const prompt = String(body.prompt ?? "").trim();
    if (!prompt) {
      return new Response(JSON.stringify({ error: "A strategy description is required." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
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

    const configuredModel = Deno.env.get("OPENROUTER_STRATEGY_MODEL");
    const freeFallbackModels = [
      "nvidia/nemotron-3-super-120b-a12b:free",
      "qwen/qwen3.8-27b:free",
      "nex-agi/nex-n2.5-pro:free",
      "liquid/lfm-2.5-2.6b:free",
    ];
    const models = configuredModel &&
      configuredModel !== "openrouter/free" &&
      configuredModel !== "poolside/laguna-xs-2.1:free"
      ? [configuredModel, ...freeFallbackModels.filter((candidate) => candidate !== configuredModel)]
      : freeFallbackModels;
    const primaryModel = models[0];
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);

    let response: Response;
    try {
      response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
          "HTTP-Referer": "https://alphentra.vercel.app",
          "X-Title": "ALPHENTRA Strategy Lab",
        },
        body: JSON.stringify({
          models,
          temperature: 0.2,
          max_tokens: 500,
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "alphentra_strategy_definition",
              strict: true,
              schema: {
                type: "object",
                additionalProperties: false,
                properties: {
                  entryOperator: { type: "string", enum: ["AND", "OR"] },
                  entry: {
                    type: "array",
                    minItems: 1,
                    maxItems: 6,
                    items: {
                      type: "object",
                      additionalProperties: false,
                      properties: {
                        indicator: { type: "string", enum: ["EMA", "SMA", "RSI", "MACD", "ATR", "PRICE", "OPEN", "HIGH", "LOW", "VOLUME"] },
                        period: { type: ["number", "null"] },
                        comparator: { type: "string", enum: ["gt", "gte", "lt", "lte", "eq", "neq", "crosses_above", "crosses_below"] },
                        value: { type: "string" },
                      },
                      required: ["indicator", "period", "comparator", "value"],
                    },
                  },
                  exitOperator: { type: "string", enum: ["AND", "OR"] },
                  exit: {
                    type: "array",
                    minItems: 1,
                    maxItems: 6,
                    items: {
                      type: "object",
                      additionalProperties: false,
                      properties: {
                        indicator: { type: "string", enum: ["EMA", "SMA", "RSI", "MACD", "ATR", "PRICE", "OPEN", "HIGH", "LOW", "VOLUME"] },
                        period: { type: ["number", "null"] },
                        comparator: { type: "string", enum: ["gt", "gte", "lt", "lte", "eq", "neq", "crosses_above", "crosses_below"] },
                        value: { type: "string" },
                      },
                      required: ["indicator", "period", "comparator", "value"],
                    },
                  },
                  stopLossPct: { type: "number", minimum: 0, maximum: 10 },
                  takeProfitPct: { type: "number", minimum: 0, maximum: 20 },
                  trailingStopPct: { type: "number", minimum: 0, maximum: 10 },
                  riskPerTradePct: { type: "number", exclusiveMinimum: 0, maximum: 2 },
                  positionSizing: { type: "string", enum: ["fixed", "risk_percent", "volatility_adjusted"] },
                },
                required: ["entryOperator", "entry", "exitOperator", "exit", "stopLossPct", "takeProfitPct", "trailingStopPct", "riskPerTradePct", "positionSizing"],
              },
            },
          },
          provider: {
            require_parameters: true,
          },
          messages: [
            { role: "system", content: system },
            { role: "user", content: prompt },
          ],
        }),
        signal: controller.signal,
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return new Response(JSON.stringify({
          error: `AI provider timed out after ${AI_TIMEOUT_MS / 1000} seconds. Please try again.`,
          provider: "openrouter",
          provider_status: 408,
          model: primaryModel,
        }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      const providerText = await response.text();
      let providerMessage = "AI provider request failed.";
      try {
        const providerBody = JSON.parse(providerText);
        providerMessage = providerBody?.error?.message ?? providerMessage;
      } catch {
        // Keep provider HTML/plain-text errors out of the client response.
      }

      return new Response(JSON.stringify({
        error: providerMessage,
        provider_status: response.status,
        model: primaryModel,
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payload = await response.json();
    const content = payload?.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error(`AI provider returned no strategy definition. Model: ${payload?.model ?? primaryModel}`);
    }

    let definition: unknown;
    try {
      definition = JSON.parse(typeof content === "string" ? content : JSON.stringify(content));
    } catch {
      const cleaned = String(content)
        .replace(/^\s*```(?:json)?\s*/i, "")
        .replace(/\s*```\s*$/i, "")
        .trim();
      try {
        definition = JSON.parse(cleaned);
      } catch {
        throw new Error(`AI provider returned non-JSON strategy content. Model: ${payload?.model ?? primaryModel}`);
      }
    }

    return new Response(JSON.stringify({ definition, model: payload?.model ?? primaryModel }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : "AI strategy generation failed.",
      provider: "openrouter",
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
