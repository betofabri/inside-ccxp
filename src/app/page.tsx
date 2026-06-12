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
  const hosts = funcionarios; // todo funcionário é host; VP/Head ganha visão geral extra

  return (
    <>
      <section className="hero">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/ccxp-insider.svg`} alt="CCXP Insider" className="logo-hero" />
        <h1>
          Convidados VIP, <em>do convite à presença</em>
        </h1>
        <div className="evento">
          <span><b>CCXP26</b></span>
          <span>03 a 06 de dezembro de 2026</span>
          <span>São Paulo Expo</span>
          <span>Protótipo navegável · escolha um papel pra entrar</span>
        </div>
      </section>

      <section className="personas">
        <div className="persona-col">
          <header>
            Admin <span className="num">master</span>
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
            Colaborador O&CO <span className="num">host</span>
          </header>
          <p className="desc">
            Convida direto da tela inicial e acompanha os próprios convites. A flag corporativa libera o lote compartilhado.
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
            Convidado <span className="num">vip</span>
          </header>
          <p className="desc">
            Carteira de códigos consolidada, link da Mundo Ticket e agenda do evento (perfil corporativo).
            Já se cadastrou? <a href={`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/acesso`} style={{ textDecoration: "underline" }}>Entre com seu código</a>.
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
