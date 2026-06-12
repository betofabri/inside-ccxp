"use client";

import { useState } from "react";

// Chips selecionáveis estilo "app de relacionamento": toggle visual + inputs
// hidden pro form action do servidor.
export default function ChipsInteresses({ opcoes }: { opcoes: string[] }) {
  const [escolhidos, setEscolhidos] = useState<Set<string>>(new Set());

  const alternar = (opcao: string) =>
    setEscolhidos((atual) => {
      const prox = new Set(atual);
      if (prox.has(opcao)) prox.delete(opcao);
      else prox.add(opcao);
      return prox;
    });

  return (
    <>
      <div className="chips-interesses">
        {opcoes.map((opcao) => {
          const ativo = escolhidos.has(opcao);
          return (
            <button
              key={opcao}
              type="button"
              className={`chip-interesse ${ativo ? "ativo" : ""}`}
              aria-pressed={ativo}
              onClick={() => alternar(opcao)}
            >
              {ativo ? "✓ " : ""}
              {opcao}
            </button>
          );
        })}
      </div>
      {[...escolhidos].map((v) => (
        <input type="hidden" name="interesse" value={v} key={v} />
      ))}
      <div className="form-acoes" style={{ marginTop: 24 }}>
        <button className="cta" type="submit" disabled={escolhidos.size === 0}>
          {escolhidos.size === 0
            ? "Escolha pelo menos um"
            : `Continuar com ${escolhidos.size} interesse(s)`}
        </button>
      </div>
    </>
  );
}
