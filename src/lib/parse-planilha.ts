// Parser client-side da planilha oficial de cortesias (SheetJS).
// Usado pelo botão de importar do host (modal) e pela seção do admin.
import * as XLSX from "xlsx";
import type { LinhaImport } from "@/lib/importacao";

export type PreviaPlanilha = {
  validas: LinhaImport[];
  rejeitadas: { linha: number; codigo: string; motivo: string }[];
  avisos: string[];
  porTipo: Record<string, { disponiveis: number; resgatados: number }>;
};

// CATEGORIA da planilha → tipo do sistema (sem acento, caixa baixa)
const CATEGORIA_TIPO: Record<string, string> = {
  "spoiler night": "spoiler_night",
  quinta: "quinta",
  sexta: "sexta",
  sabado: "sabado",
  domingo: "domingo",
  "convidado ccxp": "todos_os_dias",
  "todos os dias": "todos_os_dias",
};

const norm = (v: unknown) =>
  String(v ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();

export async function analisarPlanilha(file: File, eventoEsperado: string): Promise<PreviaPlanilha> {
  const wb = XLSX.read(await file.arrayBuffer());
  const aba = wb.Sheets[wb.SheetNames[0]];
  const linhas = XLSX.utils.sheet_to_json<Record<string, unknown>>(aba, { defval: "" });

  const avisos: string[] = [];
  const rejeitadas: PreviaPlanilha["rejeitadas"] = [];
  const validas: LinhaImport[] = [];
  const vistos = new Set<string>();
  const porTipo: PreviaPlanilha["porTipo"] = {};

  if (linhas.length === 0) {
    return { validas, rejeitadas, avisos: ["Planilha vazia ou sem cabeçalho."], porTipo };
  }

  const chaves = Object.keys(linhas[0]);
  const col = (alvo: string) => chaves.find((k) => norm(k) === alvo);
  const colCategoria = col("categoria");
  const colCodigo = col("codigo");
  const colResgatado = col("resgatado");
  const colEvento = col("evento");

  if (!colCategoria || !colCodigo || !colResgatado) {
    return {
      validas,
      rejeitadas,
      avisos: [
        `Colunas obrigatórias não encontradas: ${[!colCategoria && "CATEGORIA", !colCodigo && "CÓDIGO", !colResgatado && "RESGATADO"].filter(Boolean).join(", ")}.`,
      ],
      porTipo,
    };
  }

  const eventosForas = new Set<string>();
  linhas.forEach((l, i) => {
    const linhaN = i + 2; // 1-based + cabeçalho
    const codigo = String(l[colCodigo] ?? "").trim();
    const categoria = norm(l[colCategoria]);
    const resgatadoRaw = norm(l[colResgatado]);
    const evento = colEvento ? String(l[colEvento] ?? "").trim() : "";

    if (evento && norm(evento) !== norm(eventoEsperado)) eventosForas.add(evento);

    if (!codigo) {
      rejeitadas.push({ linha: linhaN, codigo: "(vazio)", motivo: "código vazio" });
      return;
    }
    if (vistos.has(codigo)) {
      rejeitadas.push({ linha: linhaN, codigo, motivo: "duplicado na planilha" });
      return;
    }
    const tipo = CATEGORIA_TIPO[categoria];
    if (!tipo) {
      rejeitadas.push({ linha: linhaN, codigo, motivo: `categoria desconhecida ("${String(l[colCategoria])}")` });
      return;
    }
    if (!["sim", "nao"].includes(resgatadoRaw)) {
      rejeitadas.push({ linha: linhaN, codigo, motivo: `RESGATADO deve ser SIM ou NÃO ("${String(l[colResgatado])}")` });
      return;
    }
    vistos.add(codigo);
    const resgatado = resgatadoRaw === "sim";
    validas.push({ codigo, tipo, resgatado });
    porTipo[tipo] ??= { disponiveis: 0, resgatados: 0 };
    porTipo[tipo][resgatado ? "resgatados" : "disponiveis"] += 1;
  });

  if (eventosForas.size > 0)
    avisos.push(
      `A planilha é de outro evento (${[...eventosForas].join(", ")}); o esperado é ${eventoEsperado}. As linhas serão importadas mesmo assim.`,
    );

  return { validas, rejeitadas, avisos, porTipo };
}
