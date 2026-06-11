import { redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { getPersona } from "@/lib/persona";
import { FOOTPRINT_ENABLED } from "@/lib/flags";
import { TIPO_LABEL } from "@/lib/labels";
import type { BipagemEvento } from "@/lib/footprint";
import AdminTabs from "../admin-tabs";

export const dynamic = "force-dynamic";

const norm = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

const ICONE: Record<string, string> = { entry: "→", exit: "←", stage: "★", purchase: "¤" };
const ROTULO: Record<string, string> = {
  entry: "Entrada",
  exit: "Saída",
  stage: "Palco",
  purchase: "Compra",
};

// trajeto fake determinístico por convidado + dia (até a fonte real de bipagem chegar)
function bipagensFake(convidadoId: number, credentialId: string, tipos: string[]): BipagemEvento[] {
  const DIA_DATA: Record<string, string> = {
    spoiler_night: "2026-12-02",
    quinta: "2026-12-03",
    sexta: "2026-12-04",
    sabado: "2026-12-05",
    domingo: "2026-12-06",
  };
  const dias = tipos.includes("todos_os_dias")
    ? ["quinta", "sexta", "sabado", "domingo"]
    : tipos.filter((t) => DIA_DATA[t]);

  const eventos: BipagemEvento[] = [];
  const rnd = (n: number, mod: number) => ((convidadoId * 31 + n * 17) % mod);

  dias.forEach((dia, d) => {
    const data = DIA_DATA[dia];
    const ev = (type: BipagemEvento["type"], hora: string, location: string, payload?: Record<string, unknown>) =>
      eventos.push({ credentialId, type, location, timestamp: `${data}T${hora}:00-03:00`, payload });

    ev("entry", `1${1 + rnd(d, 2)}:${String(10 + rnd(d + 1, 45)).padStart(2, "0")}`, "Entrada Sul · credenciamento VIP");
    ev("stage", `14:${String(rnd(d + 2, 50)).padStart(2, "0")}`, ["Palco Thunder", "Palco Ultra", "Artists' Valley"][rnd(d + 3, 3)], {
      painel: ["Painel principal", "Sessão de autógrafos", "Painel surpresa"][rnd(d + 4, 3)],
    });
    if (rnd(d + 5, 3) > 0)
      ev("purchase", `15:${String(10 + rnd(d + 6, 49)).padStart(2, "0")}`, ["Loja oficial CCXP", "Praça de alimentação", "Pop-up store"][rnd(d + 7, 3)], {
        valor: `R$ ${80 + rnd(d + 8, 180)},00`,
      });
    ev("stage", `17:${String(rnd(d + 9, 50)).padStart(2, "0")}`, "Lounge VIP Omelete", { painel: "Open bar e descompressão" });
    ev("exit", `19:${String(30 + rnd(d + 10, 29)).padStart(2, "0")}`, "Entrada Sul");
  });
  return eventos.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
}

const fmtHora = (iso: string) =>
  new Date(iso).toLocaleString("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

export default async function PaginaFootprint({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; id?: string }>;
}) {
  if (!FOOTPRINT_ENABLED) redirect("/admin");
  const persona = await getPersona();
  if (!persona || persona.role !== "admin") redirect("/");

  const { q, id } = await searchParams;
  const todos = await db.convidado.findMany({
    include: { convites: { include: { codigos: true, host: true } } },
    orderBy: { nome: "asc" },
  });

  const termo = (q ?? "").trim();
  const matches = termo
    ? todos.filter((c) =>
        [c.nome, c.email ?? "", c.empresa ?? ""].some((v) => norm(v).includes(norm(termo))),
      )
    : [];

  const selecionado = id
    ? todos.find((c) => c.id === Number(id))
    : matches.length === 1
      ? matches[0]
      : null;

  const ficha = selecionado
    ? (() => {
        const codigos = selecionado.convites.flatMap((cv) => cv.codigos);
        const tipos = [...new Set(codigos.map((c) => c.tipo))];
        const credentialId = `CRD-${String(selecionado.id).padStart(5, "0")}`;
        return {
          credentialId,
          tipos,
          anfitrioes: [...new Set(selecionado.convites.map((cv) => cv.host.nome))],
          eventos: bipagensFake(selecionado.id, credentialId, tipos),
        };
      })()
    : null;

  return (
    <div className="pagina">
      <h1>Footprint</h1>
      <div className="sub">
        <span>Ficha do convidado e trajeto no evento via bipagens da credencial.</span>
        <span className="badge declarado">dados de demonstração</span>
      </div>
      <AdminTabs ativa="footprint" />

      <form className="busca-footprint" action="/admin/footprint" method="get">
        <input
          type="text"
          name="q"
          placeholder="Buscar por nome, email ou empresa"
          defaultValue={termo}
          aria-label="Buscar convidado"
        />
        <button className="cta" type="submit">Buscar</button>
      </form>

      {termo && matches.length === 0 && (
        <div className="aviso">Nenhum convidado com &ldquo;{termo}&rdquo;.</div>
      )}

      {termo && matches.length > 1 && !selecionado && (
        <ul className="lista-busca" style={{ marginTop: 16 }}>
          {matches.map((c) => (
            <li key={c.id}>
              <Link href={`/admin/footprint?q=${encodeURIComponent(termo)}&id=${c.id}`}>
                <b>{c.nome}</b>
                <span className="meta">{[c.empresa, c.email].filter(Boolean).join(" · ")}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {selecionado && ficha && (
        <>
          <section className="secao ficha-cab">
            <div>
              <h2 style={{ border: "none", paddingBottom: 0 }}>{selecionado.nome}</h2>
              <div className="sub" style={{ marginTop: 6 }}>
                {selecionado.empresa && <span>{selecionado.empresa}</span>}
                {selecionado.cargo && <span className="dim">{selecionado.cargo}</span>}
                <span className="mono">{selecionado.email ?? selecionado.telefone ?? "—"}</span>
                <span className="badge solido">{ficha.credentialId}</span>
              </div>
              <div className="sub" style={{ marginTop: 10 }}>
                <span>Ingressos:</span>
                {ficha.tipos.map((t) => (
                  <span className={`badge solido t-${t}`} style={{ color: "var(--tipo-cor)" }} key={t}>
                    {TIPO_LABEL[t]}
                  </span>
                ))}
                <span className="dim">· Anfitriões: {ficha.anfitrioes.join(", ")}</span>
              </div>
            </div>
          </section>

          <section className="secao">
            <h2>
              Trajeto no evento{" "}
              <span className="nota">{ficha.eventos.length} bipagem(ns) · mock determinístico</span>
            </h2>
            {ficha.eventos.length === 0 ? (
              <div className="aviso">Sem ingressos de dia definido; nada pra mostrar ainda.</div>
            ) : (
              <ol className="trajeto">
                {ficha.eventos.map((e, i) => (
                  <li className={`bipagem bip-${e.type}`} key={i}>
                    <span className="bip-hora">{fmtHora(e.timestamp)}</span>
                    <span className="bip-icone" aria-hidden>{ICONE[e.type]}</span>
                    <div className="bip-info">
                      <b>{ROTULO[e.type]}</b> · {e.location}
                      {e.payload && (
                        <span className="bip-payload">
                          {Object.values(e.payload).join(" · ")}
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </>
      )}
    </div>
  );
}
