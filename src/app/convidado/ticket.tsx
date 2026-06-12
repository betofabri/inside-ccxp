"use client";

import { useEffect, useState } from "react";

type Props = {
  codigoId: number;
  valor: string;
  tipo: string;
  tipoLabel: string;
  host: string;
};

const CHAVE = "insider-codigos-copiados";

const lerCopiados = (): number[] => {
  try {
    return JSON.parse(localStorage.getItem(CHAVE) ?? "[]");
  } catch {
    return [];
  }
};

export default function Ticket({ codigoId, valor, tipo, tipoLabel, host }: Props) {
  const [copiado, setCopiado] = useState(false);
  const [flash, setFlash] = useState(false);

  // estado persistido localmente: nunca saberemos do resgate real neste modelo
  useEffect(() => {
    const raf = requestAnimationFrame(() => setCopiado(lerCopiados().includes(codigoId)));
    return () => cancelAnimationFrame(raf);
  }, [codigoId]);

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(valor);
    } catch {
      // fallback pra contextos sem permissão de clipboard
      const ta = document.createElement("textarea");
      ta.value = valor;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    const lista = lerCopiados();
    if (!lista.includes(codigoId)) {
      localStorage.setItem(CHAVE, JSON.stringify([...lista, codigoId]));
    }
    setCopiado(true);
    setFlash(true);
    setTimeout(() => setFlash(false), 1800);
  };

  return (
    <div className={`ticket t-${tipo} ${copiado ? "copiado" : ""}`}>
      <div className="tipo">{tipoLabel}</div>
      <button
        type="button"
        className="codigo clicavel"
        onClick={copiar}
        title="Toque pra copiar o código"
      >
        <span className="valor">{valor}</span>
        <span className="icone-copiar" aria-hidden>
          {flash ? "✓" : "⧉"}
        </span>
      </button>
      <div className="origem">Convite de {host}</div>
      <div className="rodape">
        {copiado ? (
          <span className="badge copiado-badge">{flash ? "Copiado ✓" : "Código copiado"}</span>
        ) : (
          <span className="badge entregue">Disponível</span>
        )}
      </div>
    </div>
  );
}
