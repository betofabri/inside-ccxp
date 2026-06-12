import { getCloudflareContext } from "@opennextjs/cloudflare";

type Envio = {
  para: string;
  assunto: string;
  html: string;
};

export type ResultadoEnvio = {
  ok: boolean;
  mock: boolean; // sem RESEND_API_KEY configurada, o envio é simulado
  id?: string;
  erro?: string;
};

type EnvComEmail = {
  RESEND_API_KEY?: string;
  EMAIL_FROM?: string;
};

/** Envia email via Resend; sem chave configurada, vira mock (ok=true, mock=true). */
export async function enviarEmail({ para, assunto, html }: Envio): Promise<ResultadoEnvio> {
  const { env } = getCloudflareContext() as unknown as { env: EnvComEmail };
  const chave = env.RESEND_API_KEY;
  const from = env.EMAIL_FROM || "CCXP INSIDER <onboarding@resend.dev>";

  if (!chave) return { ok: true, mock: true };

  try {
    const resp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        authorization: `Bearer ${chave}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ from, to: [para], subject: assunto, html }),
    });
    const corpo = (await resp.json()) as { id?: string; message?: string };
    if (!resp.ok) return { ok: false, mock: false, erro: corpo.message ?? `HTTP ${resp.status}` };
    return { ok: true, mock: false, id: corpo.id };
  } catch (e) {
    return { ok: false, mock: false, erro: e instanceof Error ? e.message : "falha no envio" };
  }
}

/** Template base dos emails do Insider (dark, champagne). */
export function templateEmail(titulo: string, corpo: string) {
  return `<!doctype html><html><body style="margin:0;background:#121110;font-family:Arial,Helvetica,sans-serif;color:#f2efe7;">
  <div style="max-width:560px;margin:0 auto;padding:32px 24px;">
    <p style="font-size:12px;letter-spacing:.12em;color:#e3c98e;margin:0 0 18px;"><b>CCXP INSIDER.</b> O Backstage do Backstage.</p>
    <div style="background:#1c1a17;border:1px solid #2e2b26;border-radius:12px;padding:26px 24px;">
      <h1 style="font-size:20px;margin:0 0 12px;color:#f2efe7;">${titulo}</h1>
      <div style="font-size:14px;line-height:1.6;color:#c9c2b2;">${corpo}</div>
    </div>
    <p style="font-size:11px;color:#7d776b;margin:18px 0 0;">CCXP26 · 03 a 06 dez 2026 · São Paulo Expo</p>
  </div>
</body></html>`;
}
