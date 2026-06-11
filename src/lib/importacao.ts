"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getPersona } from "@/lib/persona";

export type LinhaImport = {
  codigo: string;
  tipo: string; // spoiler_night | quinta | ... | todos_os_dias
  resgatado: boolean;
};

export type ImportResultado = {
  ok: boolean;
  erro?: string;
  inseridos?: number;
  jaResgatados?: number;
  rejeitados?: { codigo: string; motivo: string }[];
};

const TIPOS_VALIDOS = new Set([
  "spoiler_night", "quinta", "sexta", "sabado", "domingo", "todos_os_dias",
]);

/**
 * Importa códigos validados no client (a validação que vale é esta, server-side).
 * Pessoal: códigos viram do host logado. Corporativo: só admin, pool compartilhado.
 * Idempotente: códigos já existentes no sistema são rejeitados linha a linha.
 */
export async function importarCodigos(
  pool: "pessoal" | "corporativo",
  linhas: LinhaImport[],
): Promise<ImportResultado> {
  const persona = await getPersona();
  if (!persona || persona.role === "convidado")
    return { ok: false, erro: "Sessão inválida; troque de papel e tente de novo." };
  if (pool === "corporativo" && persona.role !== "admin")
    return { ok: false, erro: "Só o admin importa o lote corporativo." };

  const host = await db.funcionario.findUnique({ where: { id: persona.id } });
  if (!host) return { ok: false, erro: "Funcionário não encontrado." };

  if (linhas.length === 0) return { ok: false, erro: "Nenhuma linha válida pra importar." };
  if (linhas.length > 5000) return { ok: false, erro: "Limite de 5.000 linhas por importação." };

  // revalidação server-side (não confia no client)
  const rejeitados: { codigo: string; motivo: string }[] = [];
  const vistos = new Set<string>();
  const validas: LinhaImport[] = [];
  for (const l of linhas) {
    const codigo = (l.codigo ?? "").trim();
    if (!codigo) {
      rejeitados.push({ codigo: "(vazio)", motivo: "código vazio" });
      continue;
    }
    if (vistos.has(codigo)) {
      rejeitados.push({ codigo, motivo: "duplicado na planilha" });
      continue;
    }
    vistos.add(codigo);
    if (!TIPOS_VALIDOS.has(l.tipo)) {
      rejeitados.push({ codigo, motivo: `categoria desconhecida (${l.tipo})` });
      continue;
    }
    validas.push({ codigo, tipo: l.tipo, resgatado: !!l.resgatado });
  }

  // unicidade global: rejeita códigos que já existem (re-import idempotente)
  const existentes = new Set(
    (
      await db.codigo.findMany({
        where: { valor: { in: validas.map((l) => l.codigo) } },
        select: { valor: true },
      })
    ).map((c) => c.valor),
  );
  const novas = validas.filter((l) => {
    if (existentes.has(l.codigo)) {
      rejeitados.push({ codigo: l.codigo, motivo: "já existe no sistema" });
      return false;
    }
    return true;
  });

  const agora = new Date();
  // chunks pra respeitar o limite de parâmetros do D1
  for (let i = 0; i < novas.length; i += 50) {
    await db.codigo.createMany({
      data: novas.slice(i, i + 50).map((l) => ({
        valor: l.codigo,
        tipo: l.tipo,
        pool,
        donoId: pool === "pessoal" ? host.id : null,
        status: l.resgatado ? "resgatado" : "disponivel",
        resgateConfirmadoEm: l.resgatado ? agora : null,
      })),
    });
  }

  const jaResgatados = novas.filter((l) => l.resgatado).length;
  await db.auditLog.create({
    data: {
      atorId: host.id,
      acao: pool === "pessoal" ? "import_planilha_pessoal" : "import_lote_corporativo",
      alvo: "planilha",
      detalhe: `${novas.length} código(s) importado(s) (${jaResgatados} já resgatados), ${rejeitados.length} rejeitado(s)`,
    },
  });

  revalidatePath("/funcionario");
  revalidatePath("/admin");
  return { ok: true, inseridos: novas.length, jaResgatados, rejeitados };
}
