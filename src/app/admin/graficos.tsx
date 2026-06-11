import { TIPO_LABEL } from "@/lib/labels";

// ── Funil em barras horizontais ─────────────────────────────────

type Etapa = { nome: string; valor: number };

export function FunilBarras({ etapas }: { etapas: Etapa[] }) {
  const max = Math.max(1, ...etapas.map((e) => e.valor));
  return (
    <div className="funil-grafico">
      {etapas.map((e, i) => {
        const anterior = i > 0 ? etapas[i - 1].valor : null;
        const conversao =
          anterior && anterior > 0 ? Math.round((e.valor / anterior) * 100) : null;
        const titulo =
          conversao != null
            ? `${e.nome}: ${e.valor} (${conversao}% da etapa anterior)`
            : `${e.nome}: ${e.valor}`;
        return (
          <div className="funil-linha" key={e.nome} title={titulo}>
            <span className="funil-label">{e.nome}</span>
            <div className="funil-trilho">
              <div
                className="funil-barra"
                style={{ width: `${Math.max(4, (e.valor / max) * 100)}%` }}
              />
              <span className="funil-valor">
                {e.valor}
                {conversao != null && <small> {conversao}%</small>}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Resgates Corporativos em donut ──────────────────────────────

type Fatia = { tipo: string; usados: number; total: number };

function arco(cx: number, cy: number, r: number, ri: number, a0: number, a1: number) {
  const p = (ang: number, raio: number) => [
    cx + raio * Math.cos(ang - Math.PI / 2),
    cy + raio * Math.sin(ang - Math.PI / 2),
  ];
  const [x0, y0] = p(a0, r);
  const [x1, y1] = p(a1, r);
  const [x2, y2] = p(a1, ri);
  const [x3, y3] = p(a0, ri);
  const grande = a1 - a0 > Math.PI ? 1 : 0;
  return `M ${x0} ${y0} A ${r} ${r} 0 ${grande} 1 ${x1} ${y1} L ${x2} ${y2} A ${ri} ${ri} 0 ${grande} 0 ${x3} ${y3} Z`;
}

export function DonutResgates({ fatias }: { fatias: Fatia[] }) {
  const comUso = fatias.filter((f) => f.usados > 0);
  const totalUsados = comUso.reduce((acc, f) => acc + f.usados, 0);
  const totalPool = fatias.reduce((acc, f) => acc + f.total, 0);

  if (totalUsados === 0) {
    return <div className="aviso">Nenhum código corporativo usado ainda; o lote está intacto ({totalPool} disponíveis).</div>;
  }

  let angulo = 0;
  const segmentos = comUso.map((f) => {
    const a0 = angulo;
    const proporcao = f.usados / totalUsados;
    angulo += proporcao * Math.PI * 2;
    // folga mínima entre fatias quando há mais de uma
    const folga = comUso.length > 1 ? 0.02 : 0;
    return { ...f, a0: a0 + folga, a1: angulo - folga, pct: Math.round(proporcao * 100) };
  });

  return (
    <div className="donut-wrap">
      <svg viewBox="0 0 200 200" className="donut" role="img" aria-label="Resgates corporativos por tipo de ingresso">
        {segmentos.map((s) => (
          <path
            key={s.tipo}
            d={arco(100, 100, 92, 56, s.a0, s.a1)}
            className={`fatia t-${s.tipo}`}
          >
            <title>{`${TIPO_LABEL[s.tipo]}: ${s.usados} usado(s) de ${s.total} (${s.pct}% do consumo)`}</title>
          </path>
        ))}
        <text x="100" y="94" textAnchor="middle" className="donut-numero">{totalUsados}</text>
        <text x="100" y="116" textAnchor="middle" className="donut-legenda">de {totalPool} códigos</text>
      </svg>
      <ul className="donut-itens">
        {segmentos.map((s) => (
          <li key={s.tipo} className={`t-${s.tipo}`} title={`${s.usados} de ${s.total} usados`}>
            <span className="ponto" aria-hidden />
            <span className="nome">{TIPO_LABEL[s.tipo]}</span>
            <b>{s.usados}</b>
            <span className="dim">/ {s.total}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
