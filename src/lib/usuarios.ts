"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getPersona } from "@/lib/persona";
import { enviarEmail, templateEmail } from "@/lib/email";

// P0 — Gestão de usuários (Colaboradores O&CO): CRUD, papéis, ativação.

async function exigirAdmin() {
  const persona = await getPersona();
  if (!persona || persona.role !== "admin") redirect("/");
  return persona;
}

const lerCampos = (formData: FormData) => ({
  nome: String(formData.get("nome") ?? "").trim(),
  email: String(formData.get("email") ?? "").trim().toLowerCase(),
  nivel: String(formData.get("nivel") ?? "geral"),
  papel: String(formData.get("papel") ?? "host"),
  podeCorporativo: formData.get("podeCorporativo") === "on",
  isAdmin: formData.get("isAdmin") === "on",
});

export async function criarColaborador(formData: FormData) {
  const persona = await exigirAdmin();
  const campos = lerCampos(formData);
  if (!campos.nome || !campos.email.includes("@")) redirect("/admin/usuarios?erro=campos");

  const jaExiste = await db.funcionario.findUnique({ where: { email: campos.email } });
  if (jaExiste) redirect("/admin/usuarios?erro=email_em_uso");

  const novo = await db.funcionario.create({ data: campos });

  // convite de boas-vindas por email (real com RESEND_API_KEY, mock sem)
  const envio = await enviarEmail({
    para: campos.email,
    assunto: "Você está no CCXP INSIDER",
    html: templateEmail(
      "Bem-vindo(a) ao backstage",
      `<p>Olá, ${campos.nome.split(" ")[0]}! Você foi adicionado(a) como Colaborador O&amp;CO no
       CCXP INSIDER — a plataforma de convites VIP da CCXP26. Por lá você envia convites,
       acompanha cadastros e importa sua planilha de cortesias.</p>`,
      {
        cta: { texto: "Entrar no CCXP INSIDER", url: "https://betofabri.com/insider-ccxp" },
        notaRodape: "Acesso de colaborador · convite gerado pelo admin.",
      },
    ),
  });

  await db.auditLog.create({
    data: {
      atorId: persona.id,
      acao: "criar_colaborador",
      alvo: `colaborador:${campos.nome}`,
      detalhe: `${campos.email} · ${campos.nivel} · papel ${campos.papel}${campos.isAdmin ? " · admin" : ""} · boas-vindas ${envio.mock ? "mock" : envio.ok ? "enviadas" : "FALHOU"}`,
    },
  });
  revalidatePath("/admin/usuarios");
  redirect(`/admin/usuarios?criado=${encodeURIComponent(novo.nome)}&envio=${envio.mock ? "mock" : envio.ok ? "real" : "falha"}`);
}

export async function salvarColaborador(formData: FormData) {
  const persona = await exigirAdmin();
  const id = Number(formData.get("funcionarioId"));
  const atual = await db.funcionario.findUnique({ where: { id } });
  if (!atual) redirect("/admin/usuarios");

  const campos = lerCampos(formData);
  if (!campos.nome || !campos.email.includes("@")) redirect("/admin/usuarios?erro=campos");
  const conflito = await db.funcionario.findUnique({ where: { email: campos.email } });
  if (conflito && conflito.id !== id) redirect("/admin/usuarios?erro=email_em_uso");

  await db.funcionario.update({ where: { id }, data: campos });
  await db.auditLog.create({
    data: {
      atorId: persona.id,
      acao: "editar_colaborador",
      alvo: `colaborador:${campos.nome}`,
      detalhe: `${campos.nivel} · papel ${campos.papel} · corp ${campos.podeCorporativo ? "on" : "off"} · admin ${campos.isAdmin ? "sim" : "não"}`,
    },
  });
  revalidatePath("/admin/usuarios");
  redirect("/admin/usuarios");
}

export async function alternarAtivoColaborador(formData: FormData) {
  const persona = await exigirAdmin();
  const id = Number(formData.get("funcionarioId"));
  const alvo = await db.funcionario.findUnique({ where: { id } });
  if (!alvo) redirect("/admin/usuarios");
  // ninguém se desativa: evita trancar a porta por dentro
  if (id === persona.id) redirect("/admin/usuarios?erro=auto_desativar");

  await db.funcionario.update({ where: { id }, data: { ativo: !alvo.ativo } });
  await db.auditLog.create({
    data: {
      atorId: persona.id,
      acao: alvo.ativo ? "desativar_colaborador" : "reativar_colaborador",
      alvo: `colaborador:${alvo.nome}`,
      detalhe: alvo.ativo ? "acesso suspenso (some do hub e não assume persona)" : "acesso restaurado",
    },
  });
  revalidatePath("/admin/usuarios");
  revalidatePath("/");
}
