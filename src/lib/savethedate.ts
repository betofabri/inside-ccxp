"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getPersona } from "@/lib/persona";

// Save the Date (P1, passo 0): destinatários são pré-cadastros — Convidado
// sem nenhum convite, criado na mão ou por import de planilha (decisão 12/jun).
// O disparo é mockado (motor real = F4) e registrado no log de comunicação.

async function exigirAdmin() {
  const persona = await getPersona();
  if (!persona || persona.role !== "admin") redirect("/");
  return persona;
}

const emailValido = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

export async function adicionarPreCadastro(formData: FormData) {
  const persona = await exigirAdmin();
  const nome = String(formData.get("nome") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!nome || !emailValido(email)) redirect("/admin/regua?erro=pre_campos");

  const jaExiste = await db.convidado.findUnique({ where: { email } });
  if (jaExiste) redirect("/admin/regua?erro=pre_email_em_uso");

  await db.convidado.create({ data: { nome, email } });
  await db.auditLog.create({
    data: {
      atorId: persona.id,
      acao: "pre_cadastro",
      alvo: `convidado:${nome}`,
      detalhe: `${email} · pré-cadastrado pro Save the Date`,
    },
  });
  revalidatePath("/admin/regua");
  redirect("/admin/regua?prec=1");
}

export async function importarPreCadastros(formData: FormData) {
  const persona = await exigirAdmin();
  const texto = String(formData.get("linhas") ?? "").trim();
  if (!texto) redirect("/admin/regua?erro=pre_campos");

  // uma pessoa por linha: "Nome; email" — aceita ; , ou tab (colar do Excel)
  let criados = 0;
  let pulados = 0;
  for (const linha of texto.split("\n")) {
    const partes = linha.split(/[;,\t]/).map((p) => p.trim()).filter(Boolean);
    if (partes.length < 2) {
      if (linha.trim()) pulados++;
      continue;
    }
    const email = partes[partes.length - 1].toLowerCase();
    const nome = partes.slice(0, -1).join(" ");
    if (!nome || !emailValido(email)) {
      pulados++;
      continue;
    }
    const jaExiste = await db.convidado.findUnique({ where: { email } });
    if (jaExiste) {
      pulados++;
      continue;
    }
    await db.convidado.create({ data: { nome, email } });
    criados++;
  }

  await db.auditLog.create({
    data: {
      atorId: persona.id,
      acao: "importar_pre_cadastros",
      alvo: "save_the_date",
      detalhe: `${criados} pré-cadastrado(s) criado(s), ${pulados} linha(s) pulada(s)`,
    },
  });
  revalidatePath("/admin/regua");
  redirect(`/admin/regua?prec=${criados}&puladas=${pulados}`);
}

export async function dispararSaveTheDate(formData: FormData) {
  const persona = await exigirAdmin();
  const passo = await db.reguaPasso.findFirst({
    where: { categoria: "pre_convite", ativo: true },
    orderBy: { ordem: "asc" },
  });
  if (!passo) redirect("/admin/regua?erro=std_sem_passo");

  const destinatarios = await db.convidado.findMany({
    where: { convites: { none: {} }, email: { not: null } },
    select: { id: true },
  });
  if (destinatarios.length === 0) redirect("/admin/regua?erro=std_vazio");

  // disparo mockado (motor real chega na F4), registrado por destinatário
  for (const d of destinatarios) {
    await db.comunicacaoLog.create({
      data: {
        convidadoId: d.id,
        categoria: "pre_convite",
        passo: "save_the_date",
        canal: passo.canal,
        status: "enviado",
      },
    });
  }
  await db.auditLog.create({
    data: {
      atorId: persona.id,
      acao: "disparar_save_the_date",
      alvo: "save_the_date",
      detalhe: `"${passo.assunto}" pra ${destinatarios.length} pré-cadastrado(s) via ${passo.canal} (mock)`,
    },
  });
  redirect(`/admin/regua?std=${destinatarios.length}`);
}
