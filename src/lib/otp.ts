"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { KVNamespace } from "@cloudflare/workers-types";
import { db } from "@/lib/db";
import { enviarEmail, templateEmail } from "@/lib/email";

// OTP de 6 dígitos com TTL em Cloudflare KV (decisão registrada: substitui o
// magic link como prova de posse; o token do convite vira só o endereço).
const TTL_CODIGO = 600; // 10 min
const TTL_VERIFICADO = 1800; // 30 min pra concluir o cadastro

function kv(): KVNamespace {
  const { env } = getCloudflareContext() as unknown as { env: { OTP: KVNamespace } };
  return env.OTP;
}

const gerarCodigo = () => String(Math.floor(100000 + Math.random() * 900000));

// rate-limit de reenvio: 3 códigos por janela de 10 min por chave
const LIMITE_ENVIOS = 3;

async function estourouLimite(chaveKv: string): Promise<boolean> {
  const chave = `rl:${chaveKv}`;
  const atual = Number((await kv().get(chave)) ?? "0");
  if (atual >= LIMITE_ENVIOS) return true;
  await kv().put(chave, String(atual + 1), { expirationTtl: TTL_CODIGO });
  return false;
}

async function enviarCodigo(chaveKv: string, email: string) {
  if (await estourouLimite(chaveKv)) {
    return { mock: false, erroEnvio: "limite", codigoDemo: null };
  }
  const codigo = gerarCodigo();
  await kv().put(chaveKv, codigo, { expirationTtl: TTL_CODIGO });
  const envio = await enviarEmail({
    para: email,
    assunto: `Seu código CCXP INSIDER: ${codigo}`,
    html: templateEmail(
      "Seu código de acesso",
      `<p>Use o código abaixo pra confirmar que é você. Ele vale por 10 minutos.</p>
       <p style="font-size:32px;letter-spacing:.3em;color:#E3C98E;font-weight:bold;margin:20px 0;font-family:Courier,monospace;">${codigo}</p>
       <p>Se você não pediu este código, ignore este email.</p>`,
    ),
  });
  // sem RESEND_API_KEY o envio é mock: o código fica disponível pro modo demo
  return { mock: envio.mock, erroEnvio: envio.ok ? null : envio.erro, codigoDemo: envio.mock ? codigo : null };
}

export async function verificado(chave: string): Promise<boolean> {
  return (await kv().get(`otpok:${chave}`)) === "1";
}

// ── OTP do cadastro (convite) ───────────────────────────────────────────────

export async function solicitarOtpConvite(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  const convite = await db.convite.findUnique({
    where: { magicToken: token },
    include: { convidado: true },
  });
  if (!convite || convite.status !== "pendente") redirect(`/convite/${token}`);
  const email = convite.convidado.email;
  if (!email) redirect(`/convite/${token}`); // sem email: fluxo direto (SMS futuro)

  const r = await enviarCodigo(`otp:${token}`, email);
  const extra = r.codigoDemo
    ? `&demo=${r.codigoDemo}`
    : r.erroEnvio === "limite"
      ? `&falha=limite`
      : r.erroEnvio
        ? `&falha=1`
        : "";
  redirect(`/convite/${token}?otp=enviado${extra}`);
}

export async function validarOtpConvite(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  const codigo = String(formData.get("codigo") ?? "").replace(/\D/g, "");
  const guardado = await kv().get(`otp:${token}`);
  if (!guardado || guardado !== codigo) redirect(`/convite/${token}?otp=enviado&erro=codigo`);

  await kv().delete(`otp:${token}`);
  await kv().put(`otpok:${token}`, "1", { expirationTtl: TTL_VERIFICADO });
  redirect(`/convite/${token}`);
}

// ── OTP de acesso à carteira (convidado já cadastrado) ─────────────────────

export async function solicitarOtpAcesso(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const convidado = await db.convidado.findUnique({ where: { email } });
  if (!convidado || !convidado.consentimentoEm) redirect(`/acesso?erro=nao_encontrado`);

  const r = await enviarCodigo(`acesso:${email}`, email);
  const extra = r.codigoDemo
    ? `&demo=${r.codigoDemo}`
    : r.erroEnvio === "limite"
      ? `&falha=limite`
      : r.erroEnvio
        ? `&falha=1`
        : "";
  redirect(`/acesso?email=${encodeURIComponent(email)}${extra}`);
}

export async function validarOtpAcesso(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const codigo = String(formData.get("codigo") ?? "").replace(/\D/g, "");
  const guardado = await kv().get(`acesso:${email}`);
  if (!guardado || guardado !== codigo)
    redirect(`/acesso?email=${encodeURIComponent(email)}&erro=codigo`);

  const convidado = await db.convidado.findUnique({ where: { email } });
  if (!convidado) redirect(`/acesso?erro=nao_encontrado`);

  await kv().delete(`acesso:${email}`);
  (await cookies()).set("persona", JSON.stringify({ role: "convidado", id: convidado.id }), {
    path: "/",
  });
  redirect("/convidado");
}
