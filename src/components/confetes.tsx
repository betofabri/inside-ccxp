"use client";

import { useEffect, useState } from "react";

// Confetes de celebração — paleta Insider + verde de sucesso.
// Só client-side (estado começa vazio = sem mismatch de hidratação) e
// respeita prefers-reduced-motion (nem monta os pedaços).
const CORES = ["#FFD000", "#FF7A2F", "#ED3A86", "#E3C98E", "#7BD88A"];

type Pedaco = {
  left: number;
  delay: number;
  dur: number;
  cor: string;
  rot: number;
  tam: number;
};

export default function Confetes({ qtd = 80 }: { qtd?: number }) {
  const [pedacos, setPedacos] = useState<Pedaco[]>([]);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const raf = requestAnimationFrame(() => setPedacos(
      Array.from({ length: qtd }, () => ({
        left: Math.random() * 100,
        delay: Math.random() * 0.7,
        dur: 2.6 + Math.random() * 2,
        cor: CORES[Math.floor(Math.random() * CORES.length)],
        rot: Math.random() * 360,
        tam: 6 + Math.random() * 6,
      })),
    ));
    const t = setTimeout(() => setPedacos([]), 5600);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(t);
    };
  }, [qtd]);

  if (pedacos.length === 0) return null;
  return (
    <div className="confetes" aria-hidden>
      {pedacos.map((p, i) => (
        <span
          key={i}
          style={{
            left: `${p.left}%`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.dur}s`,
            background: p.cor,
            width: p.tam,
            height: p.tam * 0.45,
            ["--rot" as string]: `${p.rot}deg`,
          }}
        />
      ))}
    </div>
  );
}
