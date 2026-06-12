"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getPersona } from "@/lib/persona";

async function exigirAdmin() {
  const persona = await getPersona();
  if (!persona || persona.role !== "admin") redirect("/");
  return persona;
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

  // envio mockado pro próprio admin; o disparo real chega com o Resend (F4)
  await db.auditLog.create({
    data: {
      atorId: admin.id,
      acao: "teste_followup",
      alvo: `passo:${passo.rotulo}`,
      detalhe: `teste enviado pra ${admin.email} via ${passo.canal}`,
    },
  });
  redirect(
    `/admin/regua?teste=${encodeURIComponent(passo.rotulo)}&canal=${encodeURIComponent(passo.canal)}`,
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
