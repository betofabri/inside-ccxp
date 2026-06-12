"use client";

import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from "recharts";

export type EixoRadar = { eixo: string; valor: number };

// Radar de perfil do convidado (7 eixos, 0–100) — adaptação do glowing-stroke
// radar (shadcn/recharts) pro design system: sem Tailwind, cores literais dos
// tokens (SVG não resolve var() em atributo de apresentação).
const CHAMPAGNE = "oklch(84% 0.088 85)";
const GRID = "oklch(28% 0.012 75)";
const TICK = "oklch(64% 0.018 78)";

export default function RadarPerfil({ dados }: { dados: EixoRadar[] }) {
  return (
    <div className="radar-perfil">
      <ResponsiveContainer width="100%" height={250}>
        <RadarChart data={dados} cx="50%" cy="50%" outerRadius="74%">
          <defs>
            <filter id="radar-glow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>
          <PolarGrid strokeDasharray="3 3" stroke={GRID} />
          <PolarAngleAxis dataKey="eixo" tick={{ fill: TICK, fontSize: 11 }} />
          <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
          <Radar
            dataKey="valor"
            stroke={CHAMPAGNE}
            strokeWidth={2}
            fill={CHAMPAGNE}
            fillOpacity={0.07}
            filter="url(#radar-glow)"
            dot={{ r: 2.5, fill: CHAMPAGNE, strokeWidth: 0 }}
          />
        </RadarChart>
      </ResponsiveContainer>
      <span className="radar-legenda">Perfil de comportamento · 0–100 por eixo</span>
    </div>
  );
}
