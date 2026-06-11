import { db } from "@/lib/db";
import { assumirPersona } from "@/lib/actions";
import { NIVEL_LABEL } from "@/lib/labels";

export const dynamic = "force-dynamic";

export default async function Home() {
  const funcionarios = await db.funcionario.findMany({ orderBy: { id: "asc" } });
  const convidados = await db.convidado.findMany({
    orderBy: { id: "asc" },
    include: { convites: true },
  });

  const admins = funcionarios.filter((f) => f.isAdmin);
  const hosts = funcionarios.filter((f) => !f.isAdmin);

  return (
    <>
      <section className="hero">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/ccxp-logo.png" alt="CCXP" className="logo-hero" />
        <h1>
          Sistema RSVP de <em>convidados VIP</em>
        </h1>
        <div className="evento">
          <span><b>CCXP26</b></span>
          <span>03 — 06 dez 2026</span>
          <span>São Paulo Expo</span>
          <span style={{ color: "var(--amarelo)" }}>Protótipo F0 — escolha um papel pra navegar</span>
        </div>
      </section>

      <section className="personas">
        <div className="persona-col">
          <header>
            Admin <span className="num">MASTER</span>
          </header>
          <p className="desc">
            Vê tudo: funil, pool corporativo, convidados, audit log e configurações. Também convida (tem as duas cotas).
          </p>
          <ul>
            {admins.map((f) => (
              <li key={f.id}>
                <form action={assumirPersona}>
                  <input type="hidden" name="role" value="admin" />
                  <input type="hidden" name="id" value={f.id} />
                  <button className="persona-btn" type="submit">
                    <span className="nome">{f.nome}</span>
                    <span className="meta">{NIVEL_LABEL[f.nivel]}</span>
                    <span className="seta">→</span>
                  </button>
                </form>
              </li>
            ))}
          </ul>
        </div>

        <div className="persona-col">
          <header>
            Funcionário <span className="num">HOST</span>
          </header>
          <p className="desc">
            Vê saldos por tipo e pool, convida e gerencia os próprios convites. A flag corporativa libera o lote compartilhado.
          </p>
          <ul>
            {hosts.map((f) => (
              <li key={f.id}>
                <form action={assumirPersona}>
                  <input type="hidden" name="role" value="funcionario" />
                  <input type="hidden" name="id" value={f.id} />
                  <button className="persona-btn" type="submit">
                    <span className="nome">{f.nome}</span>
                    <span className="meta">
                      {NIVEL_LABEL[f.nivel]} · {f.podeCorporativo ? "com flag corp" : "sem flag"}
                    </span>
                    <span className="seta">→</span>
                  </button>
                </form>
              </li>
            ))}
          </ul>
        </div>

        <div className="persona-col">
          <header>
            Convidado <span className="num">VIP</span>
          </header>
          <p className="desc">
            Carteira de códigos consolidada, link da Mundo Ticket e agenda do evento (perfil corporativo).
          </p>
          <ul>
            {convidados.map((c) => (
              <li key={c.id}>
                <form action={assumirPersona}>
                  <input type="hidden" name="role" value="convidado" />
                  <input type="hidden" name="id" value={c.id} />
                  <button className="persona-btn" type="submit">
                    <span className="nome">{c.nome}</span>
                    <span className="meta">
                      {c.convites.length > 1
                        ? `${c.convites.length} convites`
                        : c.convites[0]?.status ?? "—"}
                    </span>
                    <span className="seta">→</span>
                  </button>
                </form>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
