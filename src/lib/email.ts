import { getCloudflareContext } from "@opennextjs/cloudflare";
import { LOGO_EMAIL_BASE64 } from "@/lib/email-logo";

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

/** Envia email via Resend com o logo embutido; sem chave vira mock (ok=true, mock=true). */
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
      body: JSON.stringify({
        from,
        to: [para],
        subject: assunto,
        html,
        attachments: html.includes("cid:logo-insider")
          ? [{ filename: "ccxp-insider.png", content: LOGO_EMAIL_BASE64, content_id: "logo-insider" }]
          : undefined,
      }),
    });
    const corpo = (await resp.json()) as { id?: string; message?: string };
    if (!resp.ok) return { ok: false, mock: false, erro: corpo.message ?? `HTTP ${resp.status}` };
    return { ok: true, mock: false, id: corpo.id };
  } catch (e) {
    return { ok: false, mock: false, erro: e instanceof Error ? e.message : "falha no envio" };
  }
}

// ── Template padrão ─────────────────────────────────────────────────────────

const COR = {
  fundo: "#121110",
  card: "#1B1815",
  borda: "#2E2A24",
  texto: "#EFEAE0",
  corpo: "#C9C2B2",
  apagado: "#857E70",
  champagne: "#E3C98E",
  escuro: "#211D16",
};

/** Transforma URLs cruas do corpo em links estilizados. */
export function linkar(texto: string) {
  return texto.replace(
    /(https?:\/\/[^\s<]+)/g,
    `<a href="$1" style="color:${COR.champagne};text-decoration:underline;">$1</a>`,
  );
}

type OpcoesTemplate = {
  /** Botão de ação principal abaixo do corpo. */
  cta?: { texto: string; url: string };
  /** Linha extra acima do rodapé (ex: quem convidou). */
  notaRodape?: string;
};

/** Template base dos emails do Insider: logo, card escuro, links champagne. */
export function templateEmail(titulo: string, corpo: string, opcoes: OpcoesTemplate = {}) {
  const cta = opcoes.cta
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:26px 0 6px;">
        <tr><td style="border-radius:9px;background:${COR.champagne};">
          <a href="${opcoes.cta.url}"
             style="display:inline-block;padding:13px 30px;font-size:14px;font-weight:bold;color:${COR.escuro};text-decoration:none;border-radius:9px;">
            ${opcoes.cta.texto}
          </a>
        </td></tr>
      </table>`
    : "";

  return `<!doctype html>
<html lang="pt-BR">
<body style="margin:0;padding:0;background:${COR.fundo};font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${COR.fundo};">
    <tr><td align="center" style="padding:40px 20px 32px;">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

        <tr><td align="left" style="padding:0 4px 22px;">
          <img src="cid:logo-insider" alt="CCXP INSIDER" width="170" style="display:block;width:170px;height:auto;border:0;" />
        </td></tr>

        <tr><td style="background:${COR.card};border:1px solid ${COR.borda};border-radius:14px;padding:32px 30px;">
          <h1 style="margin:0 0 16px;font-family:Georgia,'Times New Roman',serif;font-weight:normal;font-size:23px;line-height:1.25;color:${COR.texto};">
            ${titulo}
          </h1>
          <div style="font-size:14.5px;line-height:1.7;color:${COR.corpo};">
            ${corpo}
          </div>
          ${cta}
        </td></tr>

        <tr><td style="padding:22px 6px 0;">
          ${opcoes.notaRodape ? `<p style="margin:0 0 10px;font-size:12px;line-height:1.5;color:${COR.apagado};">${opcoes.notaRodape}</p>` : ""}
          <p style="margin:0 0 6px;font-size:12px;line-height:1.5;color:${COR.apagado};">
            <b style="color:${COR.champagne};">CCXP INSIDER</b> · A plataforma de convites e relacionamento corporativo da CCXP
          </p>
          <p style="margin:0 0 6px;font-size:12px;line-height:1.5;color:${COR.apagado};">
            CCXP26 · 03 a 06 de dezembro de 2026 · São Paulo Expo (Rod. dos Imigrantes, km 1,5 · São Paulo/SP)
          </p>
          <p style="margin:0;font-size:11px;line-height:1.5;color:${COR.apagado};">
            Você está recebendo este email porque é convidado VIP da CCXP26. Mensagem transacional do seu convite.
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
