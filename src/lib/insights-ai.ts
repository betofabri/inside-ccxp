import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { BipagemEvento } from "@/lib/footprint";

// Box de Insights da Footprint via Claude API (mesmo padrão do email/whats:
// sem ANTHROPIC_API_KEY como secret do worker, cai no mock determinístico).
// Input = bipagens agregadas por credentialId + perfil declarado.

export type InsightCard = { titulo: string; badge: string; texto: string };

type Entrada = {
  nome: string;
  dias: number;
  interesses: string[] | null;
  bipagens: BipagemEvento[];
  fallback: InsightCard[];
};

type EnvComAnthropic = { ANTHROPIC_API_KEY?: string };

export async function gerarInsightsAI({
  nome,
  dias,
  interesses,
  bipagens,
  fallback,
}: Entrada): Promise<{ cards: InsightCard[]; origem: "claude" | "mock" }> {
  const { env } = getCloudflareContext() as unknown as { env: EnvComAnthropic };
  const chave = env.ANTHROPIC_API_KEY;
  if (!chave) return { cards: fallback, origem: "mock" };

  try {
    const resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": chave,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 700,
        system:
          "Você analisa o comportamento de convidados VIP da CCXP a partir das bipagens de credencial. " +
          "Responda APENAS um array JSON com exatamente 3 objetos {titulo, badge, texto}: " +
          'titulo ∈ ["Jornada","Interesses","Consumo"]; badge é um apelido curto e divertido em inglês ou português ' +
          '(ex: "CCXP Fan", "Terror Master", "Shopper"); texto é 1-2 frases em pt-BR, específicas aos dados, tom premium e caloroso. ' +
          "Se houver interesses declarados, cruze declarado × comportamento observado.",
        messages: [
          {
            role: "user",
            content: JSON.stringify({ nome, diasNoEvento: dias, interessesDeclarados: interesses, bipagens }),
          },
        ],
      }),
    });
    if (!resp.ok) return { cards: fallback, origem: "mock" };
    const json = (await resp.json()) as { content?: { type: string; text?: string }[] };
    const texto = json.content?.find((b) => b.type === "text")?.text ?? "";
    const inicio = texto.indexOf("[");
    const fim = texto.lastIndexOf("]");
    if (inicio === -1 || fim === -1) return { cards: fallback, origem: "mock" };
    const cards = JSON.parse(texto.slice(inicio, fim + 1)) as InsightCard[];
    if (!Array.isArray(cards) || cards.length === 0 || !cards[0]?.texto) {
      return { cards: fallback, origem: "mock" };
    }
    return { cards: cards.slice(0, 3), origem: "claude" };
  } catch {
    return { cards: fallback, origem: "mock" };
  }
}
