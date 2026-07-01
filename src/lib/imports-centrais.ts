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

// ── Imports centrais (F5): resgate corporativo + presença ──────────────────

export type LinhaCsv = { codigo?: string; email?: string };

export type RelatorioCsv = {
  ok: boolean;
  erro?: string;
  casados: number;
  jaProcessados: number; // já resgatado / já presente
  naoCasados: { valor: string; motivo: string }[];
};

/** Faz o match sem aplicar nada (prévia) ou aplicando (confirmar=true). */
export async function processarCsv(
  tipo: "resgate" | "presenca",
  linhas: LinhaCsv[],
  confirmar: boolean,
): Promise<RelatorioCsv> {
  const persona = await getPersona();
  if (!persona || persona.role !== "admin")
    return { ok: false, erro: "Só o admin faz imports centrais.", casados: 0, jaProcessados: 0, naoCasados: [] };
  if (linhas.length === 0)
    return { ok: false, erro: "Nenhuma linha válida no arquivo.", casados: 0, jaProcessados: 0, naoCasados: [] };
  if (linhas.length > 10000)
    return { ok: false, erro: "Limite de 10.000 linhas por import.", casados: 0, jaProcessados: 0, naoCasados: [] };

  const agora = new Date();
  let casados = 0;
  let jaProcessados = 0;
  const naoCasados: RelatorioCsv["naoCasados"] = [];
  const idsResgatar: number[] = [];
  const idsPresenca: number[] = [];

  for (const l of linhas) {
    const codigo = (l.codigo ?? "").trim();
    const email = (l.email ?? "").trim().toLowerCase();

    if (codigo) {
      const c = await db.codigo.findUnique({ where: { valor: codigo } });
      if (!c) {
        naoCasados.push({ valor: codigo, motivo: "código não existe no sistema" });
        continue;
      }
      if (tipo === "resgate") {
        if (c.status === "resgatado") jaProcessados++;
        else if (c.status === "disponivel") {
          naoCasados.push({ valor: codigo, motivo: "código nunca foi enviado a um convidado" });
        } else {
          casados++;
          idsResgatar.push(c.id);
        }
      } else {
        if (c.presenteEm) jaProcessados++;
        else if (c.status === "entregue" || c.status === "resgatado") {
          casados++;
          idsPresenca.push(c.id);
        } else {
          naoCasados.push({ valor: codigo, motivo: "código sem entrega registrada" });
        }
      }
      continue;
    }

    if (email && tipo === "presenca") {
      const convidado = await db.convidado.findUnique({
        where: { email },
        include: { convites: { include: { codigos: true } } },
      });
      if (!convidado) {
        naoCasados.push({ valor: email, motivo: "email não encontrado" });
        continue;
      }
      const codigos = convidado.convites
        .flatMap((cv) => cv.codigos)
        .filter((c) => c.status === "entregue" || c.status === "resgatado");
      if (codigos.length === 0) {
        naoCasados.push({ valor: email, motivo: "convidado sem códigos entregues" });
        continue;
      }
      const pendentes = codigos.filter((c) => !c.presenteEm);
      if (pendentes.length === 0) jaProcessados++;
      else {
        casados++;
        idsPresenca.push(...pendentes.map((c) => c.id));
      }
      continue;
    }

    naoCasados.push({ valor: email || "(vazio)", motivo: tipo === "resgate" ? "sem código na linha" : "linha vazia" });
  }

  if (confirmar) {
    if (tipo === "resgate" && idsResgatar.length > 0) {
      for (let i = 0; i < idsResgatar.length; i += 80) {
        await db.codigo.updateMany({
          where: { id: { in: idsResgatar.slice(i, i + 80) } },
          data: { status: "resgatado", resgateConfirmadoEm: agora },
        });
      }
    }
    if (tipo === "presenca" && idsPresenca.length > 0) {
      for (let i = 0; i < idsPresenca.length; i += 80) {
        await db.codigo.updateMany({
          where: { id: { in: idsPresenca.slice(i, i + 80) } },
          data: { presenteEm: agora },
        });
      }
    }
    await db.auditLog.create({
      data: {
        atorId: persona.id,
        acao: tipo === "resgate" ? "import_resgate_central" : "import_presenca",
        alvo: "csv",
        detalhe: `${casados} casado(s), ${jaProcessados} já processado(s), ${naoCasados.length} não casado(s)`,
      },
    });
    revalidatePath("/admin");
    revalidatePath("/admin/settings");
  }

  return { ok: true, casados, jaProcessados, naoCasados };
}

// ── Configurações editáveis ─────────────────────────────────────────────────

export async function salvarConfigs(formData: FormData) {
  const persona = await exigirAdmin();
  const chaves = ["expiracao_dias", "link_mundo_ticket", "evento_inicio", "evento_fim", "evento_local", "email_teste", "whats_teste"];
  for (const chave of chaves) {
    const valor = String(formData.get(chave) ?? "").trim();
    if (!valor) {
      // campo esvaziado de propósito: remove a config (o código tem fallback)
      await db.config.delete({ where: { chave } }).catch(() => {});
      continue;
    }
    await db.config.upsert({ where: { chave }, update: { valor }, create: { chave, valor } });
  }
  await db.auditLog.create({
    data: { atorId: persona.id, acao: "editar_config", alvo: "config", detalhe: "configurações do evento atualizadas" },
  });
  revalidatePath("/admin/settings");
  redirect("/admin/settings?salvo=1");
}

export async function adicionarDominio(formData: FormData) {
  const persona = await exigirAdmin();
  const dominio = String(formData.get("dominio") ?? "").trim().toLowerCase().replace(/^@/, "");
  if (!dominio || !dominio.includes(".")) redirect("/admin/settings?erro=dominio");
  await db.dominioBloqueado.upsert({ where: { dominio }, update: {}, create: { dominio } });
  await db.auditLog.create({
    data: { atorId: persona.id, acao: "bloquear_dominio", alvo: dominio, detalhe: "domínio adicionado à lista" },
  });
  revalidatePath("/admin/settings");
  redirect("/admin/settings");
}

export async function removerDominio(formData: FormData) {
  const persona = await exigirAdmin();
  const dominio = String(formData.get("dominio") ?? "");
  await db.dominioBloqueado.deleteMany({ where: { dominio } });
  await db.auditLog.create({
    data: { atorId: persona.id, acao: "desbloquear_dominio", alvo: dominio, detalhe: "domínio removido da lista" },
  });
  revalidatePath("/admin/settings");
}
