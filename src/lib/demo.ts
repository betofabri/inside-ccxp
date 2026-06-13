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

// Reset total de um host (Camila Ramos): devolve TODOS os códigos dela ao pool
// e apaga os convites + convidados que ela criou — host volta a "cota cheia,
// zero convites" pra simular o fluxo real do começo.
const HOST_DEMO = "Camila Ramos";

export async function resetarDemoHost() {
  const host = await db.funcionario.findFirst({ where: { nome: HOST_DEMO } });
  if (!host) redirect("/?resethost=sem_host");

  const convites = await db.convite.findMany({
    where: { hostId: host.id },
    select: { id: true, convidadoId: true, magicToken: true },
  });

  const { env } = getCloudflareContext() as unknown as { env: { OTP: KVNamespace } };
  const convidadoIds = new Set<number>();

  for (const convite of convites) {
    convidadoIds.add(convite.convidadoId);
    // devolve os códigos reservados/entregues desse convite ao pool
    await db.codigo.updateMany({
      where: { conviteId: convite.id },
      data: { status: "disponivel", conviteId: null, resgateConfirmadoEm: null, presenteEm: null },
    });
    await db.conviteParcela.deleteMany({ where: { conviteId: convite.id } });
    await db.convite.delete({ where: { id: convite.id } });
    // limpa qualquer estado de OTP pendente/verificado
    await env.OTP.delete(`otp:${convite.magicToken}`);
    await env.OTP.delete(`otpok:${convite.magicToken}`);
  }

  // garante a cota cheia: qualquer código pessoal da Camila volta a disponível
  // (pega até os marcados como resgatado na importação inicial)
  await db.codigo.updateMany({
    where: { donoId: host.id },
    data: { status: "disponivel", conviteId: null, resgateConfirmadoEm: null, presenteEm: null },
  });

  // apaga os convidados que ficaram sem nenhum convite (só existiam por causa dela)
  let convidadosApagados = 0;
  for (const cid of convidadoIds) {
    const restantes = await db.convite.count({ where: { convidadoId: cid } });
    if (restantes === 0) {
      await db.comunicacaoLog.deleteMany({ where: { convidadoId: cid } });
      await db.convidado.delete({ where: { id: cid } });
      convidadosApagados++;
    }
  }

  await db.auditLog.create({
    data: {
      atorId: host.id,
      acao: "reset_demo_host",
      alvo: `host:${host.nome}`,
      detalhe: `${convites.length} convite(s) apagado(s), ${convidadosApagados} convidado(s) removido(s), cota devolvida ao pool`,
    },
  });

  revalidatePath("/");
  revalidatePath("/funcionario");
  redirect(`/?resethost=ok&convites=${convites.length}&apagados=${convidadosApagados}`);
}
