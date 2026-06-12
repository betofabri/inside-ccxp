"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getPersona } from "@/lib/persona";
import { enviarEmail, templateEmail, linkar } from "@/lib/email";
import { enviarWhatsApp } from "@/lib/whatsapp";

async function exigirAdmin() {
  const persona = await getPersona();
  if (!persona || persona.role !== "admin") redirect("/");
  return persona;
}

const URL_HUB = "https://betofabri.com/lab/inside-ccxp";

// {{link}} de um disparo real aponta pro convite do destinatário; no teste,
// usamos o convite pendente mais recente como amostra pra cair na página certa
export async function linkAmostraTeste() {
  const convite = await db.convite.findFirst({
    where: { status: "pendente" },
    orderBy: { criadoEm: "desc" },
    select: { magicToken: true },
  });
  return convite ? `${URL_HUB}/convite/${convite.magicToken}` : URL_HUB;
}

const lerCampos = (formData: FormData) => ({
  rotulo: String(formData.get("rotulo") ?? "").trim(),
  timing: String(formData.get("timing") ?? "").trim(),
  dataRef: String(formData.get("dataRef") ?? "").trim() || null,
  canal: String(formData.get("canal") ?? "email"),
  condicao: String(formData.get("condicao") ?? "").trim() || null,
  assunto: String(formData.get("assunto") ?? "").trim(),
  corpo: String(formData.get("corpo") ?? "").trim(),
});

export async function alternarPassoRegua(formData: FormData) {
  const persona = await exigirAdmin();
  const id = Number(formData.get("passoId"));
  const passo = await db.reguaPasso.findUnique({ where: { id } });
  if (!passo) redirect("/admin/regua");

  await db.reguaPasso.update({ where: { id }, data: { ativo: !passo.ativo } });
  await db.auditLog.create({
    data: {
      atorId: persona.id,
      acao: "alterar_followup",
      alvo: `passo:${passo.rotulo}`,
      detalhe: `ativo: ${passo.ativo} → ${!passo.ativo}`,
    },
  });
  revalidatePath("/admin/regua");
}

export async function salvarPassoRegua(formData: FormData) {
  const persona = await exigirAdmin();
  const id = Number(formData.get("passoId"));
  const passo = await db.reguaPasso.findUnique({ where: { id } });
  if (!passo) redirect("/admin/regua");

  const campos = lerCampos(formData);
  if (!campos.rotulo || !campos.assunto || !campos.corpo) redirect("/admin/regua?erro=campos");

  await db.reguaPasso.update({ where: { id }, data: campos });
  await db.auditLog.create({
    data: {
      atorId: persona.id,
      acao: "editar_followup",
      alvo: `passo:${campos.rotulo}`,
      detalhe: `timing ${campos.timing} · canal ${campos.canal}`,
    },
  });
  revalidatePath("/admin/regua");
  redirect("/admin/regua");
}

export async function criarPassoRegua(formData: FormData) {
  const persona = await exigirAdmin();
  const categoria = String(formData.get("categoria") ?? "regua");
  const campos = lerCampos(formData);
  if (!campos.rotulo || !campos.assunto || !campos.corpo) redirect("/admin/regua?erro=campos");

  const ultimo = await db.reguaPasso.findFirst({
    where: { categoria },
    orderBy: { ordem: "desc" },
  });
  await db.reguaPasso.create({
    data: { categoria, ordem: (ultimo?.ordem ?? 0) + 1, ...campos },
  });
  await db.auditLog.create({
    data: {
      atorId: persona.id,
      acao: "criar_passo_followup",
      alvo: `passo:${campos.rotulo}`,
      detalhe: `${categoria} · ${campos.timing}`,
    },
  });
  revalidatePath("/admin/regua");
  redirect("/admin/regua");
}

export async function excluirPassoRegua(formData: FormData) {
  const persona = await exigirAdmin();
  const id = Number(formData.get("passoId"));
  const passo = await db.reguaPasso.findUnique({ where: { id } });
  if (!passo) redirect("/admin/regua");

  await db.reguaPasso.delete({ where: { id } });
  await db.auditLog.create({
    data: {
      atorId: persona.id,
      acao: "excluir_passo_followup",
      alvo: `passo:${passo.rotulo}`,
      detalhe: `${passo.categoria} · ${passo.timing}`,
    },
  });
  revalidatePath("/admin/regua");
}

export async function enviarTestePasso(formData: FormData) {
  const persona = await exigirAdmin();
  const id = Number(formData.get("passoId"));
  const passo = await db.reguaPasso.findUnique({ where: { id } });
  const admin = await db.funcionario.findUnique({ where: { id: persona.id } });
  if (!passo || !admin) redirect("/admin/regua");

  // destinatário do teste: Config email_teste (Settings) ou o email do admin
  const cfg = await db.config.findUnique({ where: { chave: "email_teste" } });
  const destino = cfg?.valor || admin.email;

  // renderiza o template com dados de amostra
  const link = await linkAmostraTeste();
  const corpo = passo.corpo
    .replaceAll("{{nome}}", admin.nome.split(" ")[0])
    .replaceAll("{{host}}", admin.nome)
    .replaceAll("{{qtd}}", "2")
    .replaceAll("{{tipos}}", "2× Sábado")
    .replaceAll("{{link}}", link);

  const envio = await enviarEmail({
    para: destino,
    assunto: `[TESTE] ${passo.assunto}`,
    html: templateEmail(passo.assunto, `<p>${linkar(corpo)}</p>`, {
      cta: { texto: "Abrir meu convite", url: link },
      notaRodape: `Disparo de teste do passo "${passo.rotulo}" (${passo.timing}) · canal: ${passo.canal}.`,
    }),
  });

  await db.auditLog.create({
    data: {
      atorId: admin.id,
      acao: "teste_followup",
      alvo: `passo:${passo.rotulo}`,
      detalhe: envio.mock
        ? `teste mockado (sem RESEND_API_KEY) pra ${destino}`
        : envio.ok
          ? `teste REAL enviado pra ${destino} (id ${envio.id})`
          : `falha no envio pra ${destino}: ${envio.erro}`,
    },
  });
  const status = envio.mock ? "mock" : envio.ok ? "real" : "falha";
  redirect(
    `/admin/regua?teste=${encodeURIComponent(passo.rotulo)}&canal=${encodeURIComponent(passo.canal)}&envio=${status}&dest=${encodeURIComponent(destino)}`,
  );
}

export async function enviarTesteWhatsPasso(formData: FormData) {
  const persona = await exigirAdmin();
  const id = Number(formData.get("passoId"));
  const passo = await db.reguaPasso.findUnique({ where: { id } });
  const admin = await db.funcionario.findUnique({ where: { id: persona.id } });
  if (!passo || !admin) redirect("/admin/regua");

  // destinatário do teste: Config whats_teste (Settings)
  const cfg = await db.config.findUnique({ where: { chave: "whats_teste" } });
  const destino = cfg?.valor;
  if (!destino) redirect("/admin/regua?erro=sem_whats");

  const link = await linkAmostraTeste();
  const corpo = passo.corpo
    .replaceAll("{{nome}}", admin.nome.split(" ")[0])
    .replaceAll("{{host}}", admin.nome)
    .replaceAll("{{qtd}}", "2")
    .replaceAll("{{tipos}}", "2× Sábado")
    .replaceAll("{{link}}", link);

  const envio = await enviarWhatsApp({
    para: destino,
    corpo: `*[TESTE] ${passo.assunto}*\n\n${corpo}\n\n_CCXP INSIDER · CCXP26 · 03 a 06/dez · São Paulo Expo_`,
  });

  await db.auditLog.create({
    data: {
      atorId: admin.id,
      acao: "teste_followup_whats",
      alvo: `passo:${passo.rotulo}`,
      detalhe: envio.mock
        ? `teste mockado (sem WHATSAPP_TOKEN) pra ${destino}`
        : envio.ok
          ? `teste REAL via Cloud API pra ${destino} (id ${envio.id})`
          : `falha no envio pra ${destino}: ${envio.erro}`,
    },
  });
  const status = envio.mock ? "mock" : envio.ok ? "real" : "falha";
  redirect(
    `/admin/regua?teste=${encodeURIComponent(passo.rotulo)}&via=whats&envio=${status}&dest=${encodeURIComponent(destino)}${envio.erro ? `&detalhe=${encodeURIComponent(envio.erro)}` : ""}`,
  );
}

export async function enviarMensagemAdHoc(formData: FormData) {
  const persona = await exigirAdmin();
  const audiencia = String(formData.get("audiencia") ?? "vips");
  const canal = String(formData.get("canal") ?? "email");
  const assunto = String(formData.get("assunto") ?? "").trim();
  const corpo = String(formData.get("corpo") ?? "").trim();
  if (!assunto || !corpo) redirect("/admin/regua?erro=campos");

  const destinatarios = await db.convidado.findMany({
    where:
      audiencia === "vips"
        ? { convites: { some: { vipOmelete: true, status: { in: ["pendente", "cadastrado"] } } } }
        : { convites: { some: { status: { in: ["pendente", "cadastrado"] } } } },
    select: { id: true },
  });

  // envio mockado: registra no log de comunicação de cada destinatário
  for (const d of destinatarios) {
    await db.comunicacaoLog.create({
      data: {
        convidadoId: d.id,
        categoria: "ad_hoc",
        passo: assunto.slice(0, 60),
        canal,
        status: "enviado",
      },
    });
  }
  await db.auditLog.create({
    data: {
      atorId: persona.id,
      acao: "mensagem_ad_hoc",
      alvo: audiencia === "vips" ? "convidados VIP" : "todos os convidados",
      detalhe: `"${assunto}" via ${canal} pra ${destinatarios.length} convidado(s)`,
    },
  });
  redirect(`/admin/regua?adhoc=${destinatarios.length}`);
}
