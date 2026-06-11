"use client";

import { useRef, useState, useTransition, type DragEvent } from "react";
import { importarCodigos, type ImportResultado } from "@/lib/importacao";
import { analisarPlanilha, type PreviaPlanilha } from "@/lib/parse-planilha";
import { TIPO_LABEL } from "@/lib/labels";

type Props = {
  pool: "pessoal" | "corporativo";
  eventoEsperado: string;
};

export default function ImportarBotao({ pool, eventoEsperado }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [previa, setPrevia] = useState<PreviaPlanilha | null>(null);
  const [nomeArquivo, setNomeArquivo] = useState("");
  const [resultado, setResultado] = useState<ImportResultado | null>(null);
  const [arrastando, setArrastando] = useState(false);
  const [enviando, startEnvio] = useTransition();

  const abrir = async (file: File) => {
    setResultado(null);
    setNomeArquivo(file.name);
    setPrevia(await analisarPlanilha(file, eventoEsperado));
    dialogRef.current?.showModal();
  };

  const fechar = () => {
    dialogRef.current?.close();
    setPrevia(null);
    setResultado(null);
    setNomeArquivo("");
    if (inputRef.current) inputRef.current.value = "";
  };

  const aoSoltar = (e: DragEvent) => {
    e.preventDefault();
    setArrastando(false);
    const file = e.dataTransfer.files?.[0];
    if (file) abrir(file);
  };

  const confirmar = () =>
    startEnvio(async () => {
      if (!previa) return;
      const r = await importarCodigos(pool, previa.validas);
      setResultado(r);
    });

  return (
    <>
      <label
        className={`cta verde botao-importar ${arrastando ? "arrastando" : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          setArrastando(true);
        }}
        onDragLeave={() => setArrastando(false)}
        onDrop={aoSoltar}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={(e) => e.target.files?.[0] && abrir(e.target.files[0])}
        />
        <span aria-hidden>⬆</span> Importar planilha
        <small>ou arraste o arquivo aqui</small>
      </label>

      <dialog ref={dialogRef} className="modal-import" onClose={fechar}>
        <div className="modal-cab">
          <h3>{resultado?.ok ? "Importação concluída" : "Confira antes de importar"}</h3>
          <button className="acao" type="button" onClick={fechar}>Fechar</button>
        </div>

        {/* resultado final */}
        {resultado?.ok && (
          <>
            <div className="aviso ok">
              <b>{resultado.inseridos} código(s)</b> entraram no pool{" "}
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
                    {resultado.rejeitados.slice(0, 12).map((r) => (
                      <tr key={r.codigo}>
                        <td className="mono">{r.codigo}</td>
                        <td className="dim">{r.motivo}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="form-acoes" style={{ marginTop: 18, justifyContent: "flex-end" }}>
              <button className="cta" type="button" onClick={fechar}>Concluir</button>
            </div>
          </>
        )}

        {/* prévia */}
        {previa && !resultado?.ok && (
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
                    {previa.rejeitadas.slice(0, 12).map((r) => (
                      <tr key={`${r.linha}-${r.codigo}`}>
                        <td className="dim">{r.linha}</td>
                        <td className="mono">{r.codigo}</td>
                        <td className="dim">{r.motivo}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {previa.rejeitadas.length > 12 && (
                  <p className="dica">Mostrando 12 de {previa.rejeitadas.length} rejeições.</p>
                )}
              </div>
            )}

            {resultado?.erro && <p className="alerta">{resultado.erro}</p>}

            <div className="form-acoes" style={{ marginTop: 18, justifyContent: "flex-end" }}>
              <button className="cta fantasma" type="button" onClick={fechar}>
                Cancelar
              </button>
              <button
                className="cta verde"
                type="button"
                disabled={enviando || previa.validas.length === 0}
                onClick={confirmar}
              >
                {enviando ? "Importando…" : `Confirmar importação (${previa.validas.length})`}
              </button>
            </div>
          </>
        )}
      </dialog>
    </>
  );
}
