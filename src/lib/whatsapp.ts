import { getCloudflareContext } from "@opennextjs/cloudflare";

// WhatsApp Business Cloud API (Meta). Mesmo padrão do email.ts: sem as
// credenciais configuradas o envio vira mock, com elas dispara de verdade.
// Secrets do worker: WHATSAPP_TOKEN (token de acesso) e WHATSAPP_PHONE_ID
// (Phone Number ID do número remetente, não é o número em si).

export type ResultadoWhats = {
  ok: boolean;
  mock: boolean;
  id?: string;
  erro?: string;
};

type EnvComWhats = {
  WHATSAPP_TOKEN?: string;
  WHATSAPP_PHONE_ID?: string;
};

// Erros mais comuns da Cloud API traduzidos pra quem está testando
const ERRO_AMIGAVEL: Record<number, string> = {
  131047:
    "fora da janela de 24h — mensagens de texto livre só podem ser enviadas até 24h depois da última mensagem do destinatário. Mande um 'oi' do seu celular pro número de teste e tente de novo.",
  131051: "tipo de mensagem não suportado pelo destinatário.",
  131026: "destinatário não pode receber — no modo de teste da Meta, o número precisa estar na lista de destinatários verificados do app.",
  131030: "destinatário não está na lista de números permitidos do app de teste da Meta.",
  100: "parâmetro inválido — confira o WHATSAPP_PHONE_ID (é o Phone Number ID, não o número de telefone).",
  190: "token expirado ou inválido — gere um novo em developers.facebook.com e rode wrangler secret put WHATSAPP_TOKEN.",
};

/** Normaliza pro formato E.164 sem '+' que a Cloud API espera (5511999998888). */
export function normalizarWhats(numero: string) {
  const digitos = numero.replace(/\D/g, "");
  return digitos.startsWith("55") || digitos.length > 11 ? digitos : `55${digitos}`;
}

/** Envia mensagem de texto via Cloud API; sem credenciais vira mock (ok=true, mock=true). */
export async function enviarWhatsApp({ para, corpo }: { para: string; corpo: string }): Promise<ResultadoWhats> {
  const { env } = getCloudflareContext() as unknown as { env: EnvComWhats };
  const token = env.WHATSAPP_TOKEN;
  const phoneId = env.WHATSAPP_PHONE_ID;

  if (!token || !phoneId) return { ok: true, mock: true };

  try {
    const resp = await fetch(`https://graph.facebook.com/v23.0/${phoneId}/messages`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: normalizarWhats(para),
        type: "text",
        text: { preview_url: true, body: corpo },
      }),
    });
    const json = (await resp.json()) as {
      messages?: { id: string }[];
      error?: { message: string; code: number; error_data?: { details?: string } };
    };
    if (!resp.ok || json.error) {
      const e = json.error;
      const amigavel = e ? ERRO_AMIGAVEL[e.code] : undefined;
      return {
        ok: false,
        mock: false,
        erro: amigavel ?? e?.error_data?.details ?? e?.message ?? `HTTP ${resp.status}`,
      };
    }
    return { ok: true, mock: false, id: json.messages?.[0]?.id };
  } catch (e) {
    return { ok: false, mock: false, erro: e instanceof Error ? e.message : "falha no envio" };
  }
}
