"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { KVNamespace } from "@cloudflare/workers-types";
import { db } from "@/lib/db";

// Reset do convidado de teste (modo demo): devolve os convites cadastrados
// pra "pendente" pra rodar o funil completo de novo — gate de OTP, cadastro,
// carteira. O convidado de teste é quem tiver o email da Config `email_teste`.
export async function resetarDemoConvidado() {
  const cfg = await db.config.findUnique({ where: { chave: "email_teste" } });
  if (!cfg?.valor) redirect("/?reset=sem_config");

  const convidado = await db.convidado.findUnique({
    where: { email: cfg.valor },
    include: { convites: { where: { status: "cadastrado" } } },
  });
  if (!convidado || convidado.convites.length === 0) redirect("/?reset=nada");

  for (const convite of convidado.convites) {
    await db.codigo.updateMany({
      where: { conviteId: convite.id },
      data: { status: "reservado" },
    });
    await db.convite.update({ where: { id: convite.id }, data: { status: "pendente" } });
    // sem isso o gate de OTP lembra da verificação por até 30 min
    const { env } = getCloudflareContext() as unknown as { env: { OTP: KVNamespace } };
    await env.OTP.delete(`otpok:${convite.magicToken}`);
  }
  await db.convidado.update({
    where: { id: convidado.id },
    data: { consentimentoEm: null },
  });
  await db.auditLog.create({
    data: {
      atorId: 1,
      acao: "reset_demo",
      alvo: `convidado:${convidado.nome}`,
      detalhe: `${convidado.convites.length} convite(s) de volta pra pendente (modo demo)`,
    },
  });

  revalidatePath("/");
  // devolve o token mais recente pro hub mostrar o link pronto
  const maisRecente = convidado.convites[convidado.convites.length - 1];
  redirect(`/?reset=ok&qtd=${convidado.convites.length}&token=${maisRecente.magicToken}`);
}
