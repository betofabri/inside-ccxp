// Emblemas de conquista (P3 perfumaria): arte própria por badge, estética de
// achievement desbloqueado — medalhão dourado com ícone temático. Badges fora
// do conjunto conhecido caem no emblema genérico (estrela).

const OURO = "#E3C98E";
const ESCURO = "#211D16";

function Medalhao({ children }: { children: React.ReactNode }) {
  return (
    <svg className="badge-arte" viewBox="0 0 64 64" aria-hidden>
      <defs>
        <linearGradient id="ouro-emblema" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#F4E3B2" />
          <stop offset="0.5" stopColor={OURO} />
          <stop offset="1" stopColor="#B89A5C" />
        </linearGradient>
      </defs>
      {/* fita */}
      <path d="M24 44 L20 60 L32 53 L44 60 L40 44 Z" fill="#B89A5C" opacity="0.85" />
      {/* medalhão */}
      <circle cx="32" cy="28" r="22" fill="url(#ouro-emblema)" />
      <circle cx="32" cy="28" r="18" fill={ESCURO} />
      <circle cx="32" cy="28" r="18" fill="none" stroke={OURO} strokeWidth="1" opacity="0.6" />
      <g fill={OURO} stroke="none">{children}</g>
    </svg>
  );
}

const ICONES: Record<string, React.ReactNode> = {
  // caveira — Terror Master
  "terror master": (
    <path d="M32 17c-6 0-10 4.4-10 10 0 3.4 1.6 5.8 3.6 7.3l.4 4.2h3l.3-2.5h1.4l.3 2.5h2l.3-2.5h1.4l.3 2.5h3l.4-4.2c2-1.5 3.6-3.9 3.6-7.3 0-5.6-4-10-10-10zm-4.5 12.5a3 3 0 1 1 0-6 3 3 0 0 1 0 6zm9 0a3 3 0 1 1 0-6 3 3 0 0 1 0 6z" />
  ),
  // sacola — Shopper
  shopper: (
    <path d="M24 23h16l2 14a2 2 0 0 1-2 2.3H24A2 2 0 0 1 22 37l2-14zm4 0v-1.5a4 4 0 0 1 8 0V23h-2.4v-1.5a1.6 1.6 0 0 0-3.2 0V23H28z" />
  ),
  // raio + estrela — CCXP Fan
  "ccxp fan": (
    <path d="M34 15 24 30h6l-2 13 10-15h-6l2-13z" />
  ),
};

export default function BadgeArte({ nome }: { nome: string }) {
  const icone = ICONES[nome.toLowerCase()] ?? (
    // estrela genérica pra badges criados pela AI fora do conjunto conhecido
    <path d="M32 16l4.2 8.6 9.5 1.3-6.9 6.7 1.7 9.4L32 37.5 23.5 42l1.7-9.4-6.9-6.7 9.5-1.3L32 16z" />
  );
  return <Medalhao>{icone}</Medalhao>;
}
