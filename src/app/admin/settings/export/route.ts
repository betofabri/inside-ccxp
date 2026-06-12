import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getPersona } from "@/lib/persona";
import { STATUS_CONVITE_LABEL } from "@/lib/labels";

export const dynamic = "force-dynamic";

// CSV pt-BR: separador ; e BOM pro Excel abrir acentos certos
const celula = (v: unknown) => {
  const s = String(v ?? "");
  return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const csv = (linhas: unknown[][]) =>
  "﻿" + linhas.map((l) => l.map(celula).join(";")).join("\n");

const fmt = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : "");

export async function GET(req: NextRequest) {
  const persona = await getPersona();
  if (!persona || persona.role !== "admin") {
    return new Response("Só o admin exporta dados.", { status: 403 });
  }

  const tipo = req.nextUrl.searchParams.get("tipo") ?? "convidados";

  let nome = "export";
  let conteudo = "";

  if (tipo === "comunicacao") {
    nome = "log-comunicacao";
    const logs = await db.comunicacaoLog.findMany({
      include: { convidado: true },
      orderBy: { data: "desc" },
    });
    conteudo = csv([
      ["Convidado", "Email", "Categoria", "Passo", "Canal", "Status", "Data"],
      ...logs.map((l) => [
        l.convidado.nome, l.convidado.email ?? "", l.categoria, l.passo, l.canal, l.status,
        l.data.toISOString(),
      ]),
    ]);
  } else {
    nome = tipo === "vip" ? "convidados-vip" : "convidados";
    const convidados = await db.convidado.findMany({
      include: { convites: { include: { host: true, codigos: true } } },
      orderBy: { nome: "asc" },
    });
    const filtrados =
      tipo === "vip" ? convidados.filter((c) => c.convites.some((cv) => cv.vipOmelete)) : convidados;
    conteudo = csv([
      ["Nome", "Email", "WhatsApp", "Empresa", "Cargo", "Nascimento", "Instagram", "LinkedIn",
        "LGPD", "VIP", "Anfitrioes", "Codigos", "Resgatados", "Presentes", "Status dos convites"],
      ...filtrados.map((c) => {
        const codigos = c.convites.flatMap((cv) => cv.codigos);
        return [
          c.nome, c.email ?? "", c.telefone ?? "", c.empresa ?? "", c.cargo ?? "",
          fmt(c.nascimento), c.instagram ?? "", c.linkedin ?? "",
          c.consentimentoEm ? "sim" : "nao",
          c.convites.some((cv) => cv.vipOmelete) ? "sim" : "nao",
          [...new Set(c.convites.map((cv) => cv.host.nome))].join(", "),
          codigos.length,
          codigos.filter((k) => k.status === "resgatado").length,
          codigos.filter((k) => k.presenteEm).length,
          [...new Set(c.convites.map((cv) => STATUS_CONVITE_LABEL[cv.status] ?? cv.status))].join(", "),
        ];
      }),
    ]);
  }

  await db.auditLog.create({
    data: { atorId: persona.id, acao: "export_csv", alvo: nome, detalhe: `export ${tipo} gerado` },
  });

  return new Response(conteudo, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="insider-${nome}.csv"`,
    },
  });
}
