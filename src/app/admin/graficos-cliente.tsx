"use client";

import { useEffect, useState } from "react";
import { FunnelChart } from "@/components/ui/funnel-chart";
import { TIPO_LABEL } from "@/lib/labels";

// ─── Funil do evento (gradiente do logo Insider: amarelo → laranja → rosa) ──

const PALETA_INSIDER = [
  "#FFD000", "#FFB310", "#FF971F", "#FF7A2F", "#F9654C", "#F34F69", "#ED3A86",
];

export function FunilEvento({ etapas }: { etapas: { nome: string; valor: number }[] }) {
  const [vertical, setVertical] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 700px)");
    const aplica = () => setVertical(mq.matches);
    aplica();
    mq.addEventListener("change", aplica);
    return () => mq.removeEventListener("change", aplica);
  }, []);

  if (!etapas.length || etapas[0].valor <= 0) {
    return <div className="aviso">Sem convidados ainda; o funil aparece com o primeiro convite.</div>;
  }

  // distribui o gradiente do logo pela quantidade de etapas que vier
  const ancora = (i: number) =>
    PALETA_INSIDER[Math.round((i * (PALETA_INSIDER.length - 1)) / etapas.length)];

  return (
    <FunnelChart
      data={etapas.map((e, i) => ({
        label: e.nome,
        value: e.valor,
        gradient: [
          { offset: 0, color: ancora(i) },
          { offset: 1, color: ancora(i + 1) },
        ],
      }))}
      orientation={vertical ? "vertical" : "horizontal"}
      layers={3}
      showValues={false}
      style={{ marginTop: 18 }}
    />
  );
}

// ─── Resgates Corporativos em barras (largura total) ────────────────────────

type Fatia = { tipo: string; usados: number; total: number };

export function BarrasResgates({ fatias }: { fatias: Fatia[] }) {
  const totalPool = fatias.reduce((acc, f) => acc + f.total, 0);
  const totalUsados = fatias.reduce((acc, f) => acc + f.usados, 0);
  const comDados = fatias.filter((f) => f.total > 0);

  if (totalPool === 0) {
    return <div className="aviso">Nenhum código corporativo importado ainda.</div>;
  }

  return (
    <div className="barras-resgates">
      <p className="br-resumo">
        <b>{totalUsados}</b> de <b>{totalPool}</b> códigos do lote em uso (
        {Math.round((totalUsados / totalPool) * 100)}%)
      </p>
      {comDados.map((f, i) => {
        const pct = Math.round((f.usados / f.total) * 100);
        return (
          <div
            className={`br-linha t-${f.tipo}`}
            key={f.tipo}
            title={`${TIPO_LABEL[f.tipo]}: ${f.usados} de ${f.total} usados (${pct}%)`}
          >
            <span className="br-label">{TIPO_LABEL[f.tipo]}</span>
            <div className="br-trilho">
              <div
                className="br-fill"
                style={{ width: `${Math.max(pct, f.usados > 0 ? 2 : 0)}%`, animationDelay: `${i * 70}ms` }}
              />
            </div>
            <span className="br-numeros">
              <b>{f.usados}</b>
              <span className="de">/ {f.total}</span>
              <span className="pct">{pct}%</span>
            </span>
          </div>
        );
      })}
    </div>
  );
}
