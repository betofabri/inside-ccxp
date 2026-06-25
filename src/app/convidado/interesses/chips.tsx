"use client";

import { useState } from "react";

// Chips selecionáveis estilo "app de relacionamento". O `value` enviado é
// sempre o canônico em PT (dado limpo no banco); o `label` é traduzido.
type Opcao = { value: string; label: string };

export default function ChipsInteresses({
  opcoes,
  rotuloVazio,
  rotuloContinuar,
}: {
  opcoes: Opcao[];
  rotuloVazio: string;
  rotuloContinuar: (n: number) => string;
}) {
  const [escolhidos, setEscolhidos] = useState<Set<string>>(new Set());

  const alternar = (value: string) =>
    setEscolhidos((atual) => {
      const prox = new Set(atual);
      if (prox.has(value)) prox.delete(value);
      else prox.add(value);
      return prox;
    });

  return (
    <>
      <div className="chips-interesses">
        {opcoes.map((opcao) => {
          const ativo = escolhidos.has(opcao.value);
          return (
            <button
              key={opcao.value}
              type="button"
              className={`chip-interesse ${ativo ? "ativo" : ""}`}
              aria-pressed={ativo}
              onClick={() => alternar(opcao.value)}
            >
              {ativo ? "✓ " : ""}
              {opcao.label}
            </button>
          );
        })}
      </div>
      {[...escolhidos].map((v) => (
        <input type="hidden" name="interesse" value={v} key={v} />
      ))}
      <div className="form-acoes" style={{ marginTop: 24 }}>
        <button className="cta" type="submit" disabled={escolhidos.size === 0}>
          {escolhidos.size === 0 ? rotuloVazio : rotuloContinuar(escolhidos.size)}
        </button>
      </div>
    </>
  );
}
