"use client";

import { useEffect, useState } from "react";
import { Pie, PieChart, Cell, Tooltip, LabelList } from "recharts";
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
      style={{ marginTop: 18, maxWidth: 860 }}
    />
  );
}

// ─── Pizza de Resgates Corporativos (raio crescente por fatia) ──────────────

const TIPO_COR: Record<string, string> = {
  spoiler_night: "oklch(79% 0.115 305)",
  quinta: "oklch(78% 0.1 235)",
  sexta: "oklch(80% 0.1 190)",
  sabado: "oklch(80% 0.125 150)",
  domingo: "oklch(80% 0.115 60)",
  todos_os_dias: "oklch(84% 0.088 85)",
};

type Fatia = { tipo: string; usados: number; total: number };

function TipFatia({ active, payload }: { active?: boolean; payload?: { payload: Fatia & { nome: string; fill: string } }[] }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="tip-grafico">
      <span className="ponto" style={{ backgroundColor: d.fill }} aria-hidden />
      {d.nome}: <b>{d.usados}</b> de {d.total} usados
    </div>
  );
}

const BASE_RADIUS = 74;
const SIZE_INCREMENT = 11;
const INNER_RADIUS = 42;

export function PizzaResgates({ fatias }: { fatias: Fatia[] }) {
  const totalPool = fatias.reduce((acc, f) => acc + f.total, 0);
  // menor → maior, como no padrão do componente (raio cresce com a fatia)
  const dados = fatias
    .filter((f) => f.usados > 0)
    .sort((a, b) => a.usados - b.usados)
    .map((f) => ({ ...f, nome: TIPO_LABEL[f.tipo], fill: TIPO_COR[f.tipo] }));
  const totalUsados = dados.reduce((acc, f) => acc + f.usados, 0);

  if (totalUsados === 0) {
    return (
      <div className="aviso">
        Nenhum código corporativo usado ainda; o lote está intacto ({totalPool} disponíveis).
      </div>
    );
  }

  const acumuladoAte = (i: number) =>
    (dados.slice(0, i).reduce((s, d) => s + d.usados, 0) / totalUsados) * 360;

  const lado = 2 * (BASE_RADIUS + (dados.length - 1) * SIZE_INCREMENT) + 28;

  return (
    <div className="pizza-wrap">
      <div className="pizza-area" style={{ width: lado, height: lado }}>
        <PieChart width={lado} height={lado}>
          <Tooltip content={<TipFatia />} />
          {dados.map((entrada, i) => (
            <Pie
              key={entrada.tipo}
              data={[entrada]}
              dataKey="usados"
              innerRadius={INNER_RADIUS}
              outerRadius={BASE_RADIUS + i * SIZE_INCREMENT}
              cornerRadius={4}
              startAngle={acumuladoAte(i)}
              endAngle={acumuladoAte(i + 1)}
              stroke="none"
              isAnimationActive
            >
              <Cell fill={entrada.fill} />
              <LabelList
                dataKey="usados"
                stroke="none"
                fontSize={12}
                fontWeight={650}
                fill="oklch(21% 0.025 80)"
              />
            </Pie>
          ))}
        </PieChart>
        <div className="pizza-centro" aria-hidden>
          <b>{totalUsados}</b>
          <span>de {totalPool}</span>
        </div>
      </div>
      <ul className="donut-itens">
        {dados
          .slice()
          .reverse()
          .map((d) => (
            <li key={d.tipo} title={`${d.usados} de ${d.total} usados`}>
              <span className="ponto" style={{ backgroundColor: d.fill }} aria-hidden />
              <span className="nome">{d.nome}</span>
              <b>{d.usados}</b>
              <span className="dim">/ {d.total}</span>
            </li>
          ))}
      </ul>
    </div>
  );
}
