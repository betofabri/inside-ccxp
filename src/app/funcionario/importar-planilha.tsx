"use client";

import { useState, useTransition } from "react";
import * as XLSX from "xlsx";
import { importarCodigos, type ImportResultado, type LinhaImport } from "@/lib/importacao";
import { TIPO_LABEL } from "@/lib/labels";

type Props = {
  pool: "pessoal" | "corporativo";
  eventoEsperado: string; // ex: "CCXP26"
};

type Previa = {
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

export default function ImportarPlanilha({ pool, eventoEsperado }: Props) {
  const [previa, setPrevia] = useState<Previa | null>(null);
  const [nomeArquivo, setNomeArquivo] = useState("");
  const [resultado, setResultado] = useState<ImportResultado | null>(null);
  const [enviando, startEnvio] = useTransition();

  const limpar = () => {
    setPrevia(null);
    setResultado(null);
    setNomeArquivo("");
  };

  const analisar = async (file: File) => {
    setResultado(null);
    setNomeArquivo(file.name);
    const wb = XLSX.read(await file.arrayBuffer());
    const aba = wb.Sheets[wb.SheetNames[0]];
    const linhas = XLSX.utils.sheet_to_json<Record<string, unknown>>(aba, { defval: "" });

    const avisos: string[] = [];
    const rejeitadas: Previa["rejeitadas"] = [];
    const validas: LinhaImport[] = [];
    const vistos = new Set<string>();
    const porTipo: Previa["porTipo"] = {};

    if (linhas.length === 0) {
      setPrevia({ validas: [], rejeitadas: [], avisos: ["Planilha vazia ou sem cabeçalho."], porTipo });
      return;
    }

    // localiza colunas pelo cabeçalho normalizado (CÓDIGO/CODIGO etc.)
    const chaves = Object.keys(linhas[0]);
    const col = (alvo: string) => chaves.find((k) => norm(k) === alvo);
    const colCategoria = col("categoria");
    const colCodigo = col("codigo");
    const colResgatado = col("resgatado");
    const colEvento = col("evento");

    if (!colCategoria || !colCodigo || !colResgatado) {
      setPrevia({
        validas: [],
        rejeitadas: [],
        avisos: [
          `Colunas obrigatórias não encontradas: ${[!colCategoria && "CATEGORIA", !colCodigo && "CÓDIGO", !colResgatado && "RESGATADO"].filter(Boolean).join(", ")}.`,
        ],
        porTipo,
      });
      return;
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

    setPrevia({ validas, rejeitadas, avisos, porTipo });
  };

  const confirmar = () =>
    startEnvio(async () => {
      if (!previa) return;
      const r = await importarCodigos(pool, previa.validas);
      setResultado(r);
      if (r.ok) setPrevia(null);
    });

  // ── resultado final ──
  if (resultado?.ok) {
    return (
      <div className="import-bloco">
        <div className="aviso ok">
          <b>Importação concluída ✓</b> {resultado.inseridos} código(s) entraram no pool{" "}
          {pool === "pessoal" ? "pessoal" : "corporativo"}
          {resultado.jaResgatados ? `, ${resultado.jaResgatados} já resgatados na origem` : ""}.
          {resultado.rejeitados && resultado.rejeitados.length > 0 && (
            <> {resultado.rejeitados.length} rejeitado(s) pelo servidor.</>
          )}
        </div>
        {resultado.rejeitados && resultado.rejeitados.length > 0 && (
          <div className="tabela-wrap">
            <table className="tabela">
              <thead>
                <tr><th>Código</th><th>Motivo</th></tr>
              </thead>
              <tbody>
                {resultado.rejeitados.slice(0, 20).map((r) => (
                  <tr key={r.codigo}>
                    <td className="mono">{r.codigo}</td>
                    <td className="dim">{r.motivo}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <button className="cta fantasma" type="button" onClick={limpar} style={{ marginTop: 14 }}>
          Importar outra planilha
        </button>
      </div>
    );
  }

  return (
    <div className="import-bloco">
      {!previa && (
        <>
          <label className="zona-upload">
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={(e) => e.target.files?.[0] && analisar(e.target.files[0])}
            />
            <span className="zona-titulo">Escolher planilha (.xlsx)</span>
            <span className="zona-dica">
              Formato: NOME · EVENTO · CATEGORIA · INGRESSO · TIPO · CÓDIGO · RESGATADO
            </span>
          </label>
          {resultado?.erro && <p className="alerta">{resultado.erro}</p>}
        </>
      )}

      {previa && (
        <>
          <div className="sub" style={{ marginTop: 0 }}>
            <span className="mono">{nomeArquivo}</span>
            <span className="badge solido">{previa.validas.length} válidas</span>
            {previa.rejeitadas.length > 0 && (
              <span className="badge cancelado">{previa.rejeitadas.length} rejeitadas</span>
            )}
          </div>

          {previa.avisos.map((a) => (
            <div className="aviso" key={a}>{a}</div>
          ))}

          {Object.keys(previa.porTipo).length > 0 && (
            <div className="saldo-strip">
              {Object.entries(previa.porTipo).map(([tipo, n]) => (
                <span className={`saldo-chip t-${tipo}`} key={tipo}>
                  <span className="nome-tipo">{TIPO_LABEL[tipo]}</span>
                  <span className="par"><small>novos</small><span className="n c">{n.disponiveis}</span></span>
                  {n.resgatados > 0 && (
                    <>
                      <span className="sep" aria-hidden />
                      <span className="par"><small>resg.</small><span className="n p">{n.resgatados}</span></span>
                    </>
                  )}
                </span>
              ))}
            </div>
          )}

          {previa.rejeitadas.length > 0 && (
            <div className="tabela-wrap">
              <table className="tabela">
                <thead>
                  <tr><th>Linha</th><th>Código</th><th>Motivo</th></tr>
                </thead>
                <tbody>
                  {previa.rejeitadas.slice(0, 20).map((r) => (
                    <tr key={`${r.linha}-${r.codigo}`}>
                      <td className="dim">{r.linha}</td>
                      <td className="mono">{r.codigo}</td>
                      <td className="dim">{r.motivo}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {previa.rejeitadas.length > 20 && (
                <p className="dica">Mostrando 20 de {previa.rejeitadas.length} rejeições.</p>
              )}
            </div>
          )}

          {resultado?.erro && <p className="alerta">{resultado.erro}</p>}

          <div className="form-acoes" style={{ marginTop: 16 }}>
            <button className="cta fantasma" type="button" onClick={limpar}>
              Cancelar
            </button>
            <button
              className="cta"
              type="button"
              disabled={enviando || previa.validas.length === 0}
              onClick={confirmar}
            >
              {enviando ? "Importando…" : `Confirmar importação (${previa.validas.length})`}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
