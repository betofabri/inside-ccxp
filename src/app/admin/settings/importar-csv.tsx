"use client";

import { useState, useTransition } from "react";
import * as XLSX from "xlsx";
import { processarCsv, type LinhaCsv, type RelatorioCsv } from "@/lib/imports-centrais";

type Props = {
  tipo: "resgate" | "presenca";
};

const norm = (v: unknown) =>
  String(v ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();

export default function ImportarCsv({ tipo }: Props) {
  const [linhas, setLinhas] = useState<LinhaCsv[] | null>(null);
  const [nomeArquivo, setNomeArquivo] = useState("");
  const [previa, setPrevia] = useState<RelatorioCsv | null>(null);
  const [resultado, setResultado] = useState<RelatorioCsv | null>(null);
  const [processando, startProcesso] = useTransition();

  const limpar = () => {
    setLinhas(null);
    setPrevia(null);
    setResultado(null);
    setNomeArquivo("");
  };

  const analisar = async (file: File) => {
    limpar();
    setNomeArquivo(file.name);
    const wb = XLSX.read(await file.arrayBuffer());
    const aba = wb.Sheets[wb.SheetNames[0]];
    const brutas = XLSX.utils.sheet_to_json<Record<string, unknown>>(aba, { defval: "" });
    if (brutas.length === 0) {
      setPrevia({ ok: false, erro: "Arquivo vazio ou sem cabeçalho.", casados: 0, jaProcessados: 0, naoCasados: [] });
      return;
    }
    const chaves = Object.keys(brutas[0]);
    const col = (alvo: string) => chaves.find((k) => norm(k) === alvo);
    const colCodigo = col("codigo");
    const colEmail = col("email") ?? col("e-mail");
    if (!colCodigo && !(tipo === "presenca" && colEmail)) {
      setPrevia({
        ok: false,
        erro: tipo === "resgate"
          ? "Coluna CÓDIGO não encontrada."
          : "Nenhuma coluna CÓDIGO ou EMAIL encontrada.",
        casados: 0, jaProcessados: 0, naoCasados: [],
      });
      return;
    }
    const parseadas: LinhaCsv[] = brutas.map((b) => ({
      codigo: colCodigo ? String(b[colCodigo] ?? "").trim() : undefined,
      email: colEmail ? String(b[colEmail] ?? "").trim() : undefined,
    })).filter((l) => l.codigo || l.email);
    setLinhas(parseadas);
    startProcesso(async () => {
      setPrevia(await processarCsv(tipo, parseadas, false));
    });
  };

  const confirmar = () =>
    startProcesso(async () => {
      if (!linhas) return;
      setResultado(await processarCsv(tipo, linhas, true));
    });

  const relatorio = (r: RelatorioCsv) => (
    <>
      <div className="sub" style={{ marginTop: 12 }}>
        <span className="mono">{nomeArquivo}</span>
        <span className="badge resgatado">{r.casados} casado(s)</span>
        {r.jaProcessados > 0 && <span className="badge solido">{r.jaProcessados} já processado(s)</span>}
        {r.naoCasados.length > 0 && <span className="badge cancelado">{r.naoCasados.length} não casado(s)</span>}
      </div>
      {r.naoCasados.length > 0 && (
        <div className="tabela-wrap">
          <table className="tabela">
            <thead>
              <tr><th>Valor</th><th>Motivo</th></tr>
            </thead>
            <tbody>
              {r.naoCasados.slice(0, 12).map((n, i) => (
                <tr key={`${n.valor}-${i}`}>
                  <td className="mono">{n.valor}</td>
                  <td className="dim">{n.motivo}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {r.naoCasados.length > 12 && <p className="dica">Mostrando 12 de {r.naoCasados.length}.</p>}
        </div>
      )}
    </>
  );

  if (resultado?.ok) {
    return (
      <div className="import-bloco">
        <div className="aviso ok">
          <b>Import aplicado ✓</b> {resultado.casados} código(s){" "}
          {tipo === "resgate" ? "marcados como resgatados" : "marcados como presentes"}. Operação no audit log.
        </div>
        {relatorio(resultado)}
        <button className="cta fantasma" type="button" onClick={limpar} style={{ marginTop: 14 }}>
          Importar outro arquivo
        </button>
      </div>
    );
  }

  return (
    <div className="import-bloco">
      {!previa && !processando && (
        <label className="zona-upload">
          <input
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={(e) => e.target.files?.[0] && analisar(e.target.files[0])}
          />
          <span className="zona-titulo">Escolher arquivo (.csv ou .xlsx)</span>
          <span className="zona-dica">
            {tipo === "resgate"
              ? "Export da Mundo Ticket · precisa da coluna CÓDIGO"
              : "Export do controle de acesso · coluna CÓDIGO ou EMAIL"}
          </span>
        </label>
      )}

      {processando && !previa && <p className="dica">Conferindo o arquivo…</p>}

      {previa && !previa.ok && <div className="aviso erro">{previa.erro}</div>}

      {previa?.ok && (
        <>
          <p className="dica" style={{ marginTop: 4 }}>
            Prévia: nada foi alterado ainda. Confira o relatório e confirme.
          </p>
          {relatorio(previa)}
          <div className="form-acoes" style={{ marginTop: 16 }}>
            <button className="cta fantasma" type="button" onClick={limpar}>Cancelar</button>
            <button
              className="cta"
              type="button"
              disabled={processando || previa.casados === 0}
              onClick={confirmar}
            >
              {processando ? "Aplicando…" : `Confirmar (${previa.casados})`}
            </button>
          </div>
        </>
      )}

      {previa && !previa.ok && (
        <button className="cta fantasma" type="button" onClick={limpar} style={{ marginTop: 12 }}>
          Tentar outro arquivo
        </button>
      )}
    </div>
  );
}
