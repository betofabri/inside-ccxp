import { db } from "@/lib/db";
import { assumirPersona } from "@/lib/actions";
import { resetarDemoConvidado } from "@/lib/demo";
import { NIVEL_LABEL } from "@/lib/labels";

export const dynamic = "force-dynamic";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ reset?: string; qtd?: string; token?: string; erro?: string }>;
}) {
  const { reset, qtd, token, erro } = await searchParams;
  // só ativos aparecem no hub; admin entra por /backstage (fora da navegação)
  const funcionarios = await db.funcionario.findMany({ where: { ativo: true }, orderBy: { id: "asc" } });
  const convidados = await db.convidado.findMany({
    orderBy: { id: "asc" },
    include: { convites: true },
  });

  const hosts = funcionarios; // todo funcionário é host; VP/Head ganha visão geral extra

  return (
    <>
      <section className="hero">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/ccxp-insider.svg`} alt="CCXP Insider" className="logo-hero" />
        <h1>
          A plataforma de RSVP e relacionamento para convidados especiais{" "}
          <em>pré, durante e pós CCXP</em>
        </h1>
        <div className="evento">
          <span><b>CCXP26</b></span>
          <span>03 a 06 de dezembro de 2026</span>
          <span>São Paulo Expo</span>
          <span>Protótipo navegável · escolha um papel pra entrar</span>
        </div>
        <div className="hero-ctas">
          <a className="cta" href="#personas">Sou host</a>
          <a className="cta fantasma" href={`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/acesso`}>
            Sou convidado
          </a>
        </div>
      </section>

      {erro === "desativado" && (
        <div className="aviso erro" style={{ maxWidth: 720, margin: "18px auto 0" }}>
          Esse acesso foi desativado pelo admin. Fale com a equipe CCXP INSIDER.
        </div>
      )}

      {/* Admin fora da navegação (P4): entrada só por /backstage */}
      <section className="personas" id="personas">
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

      <section className="backlog-vivo">
        <h2>Backlog vivo</h2>
        <p className="dica">
          O que vem por aí e o que ainda é demonstração — visível pra todos durante a fase de teste.
        </p>
        <ul>
          <li>▸ Disparo automático da régua por agendamento (hoje: botão &ldquo;Processar régua agora&rdquo; no admin)</li>
          <li>▸ Integração Mundo Ticket (bipagens reais da Footprint) — aguardando definição com o fornecedor</li>
          <li>▸ Email com domínio próprio (hoje os envios reais chegam só no email de teste) e templates oficiais de WhatsApp</li>
          <li>▸ Login definitivo com Google SSO pro time e gating por papel (produção/portaria)</li>
        </ul>
        <p className="dica atencao">
          ⚠️ Protótipo com dados de exemplo; resgates e presenças são simulados. Este quadro sai do ar no go-live.
        </p>
      </section>

      <section className="demo-reset">
        {reset === "ok" && (
          <div className="aviso ok">
            <b>Demo resetada ✓</b> {qtd} convite(s) de volta pra pendente — OTP e cadastro vão rodar de
            novo.{" "}
            {token && (
              <a
                href={`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/convite/${token}`}
                style={{ textDecoration: "underline" }}
              >
                Abrir o convite de teste
              </a>
            )}
          </div>
        )}
        {reset === "nada" && (
          <div className="aviso">
            Nada pra resetar: o convidado de teste não tem convite cadastrado no momento.
          </div>
        )}
        {reset === "sem_config" && (
          <div className="aviso erro">
            Defina o <b>email pra testes</b> em Admin → Settings antes de usar o reset.
          </div>
        )}
        <form action={resetarDemoConvidado}>
          <button className="acao" type="submit" title="Volta os convites cadastrados do convidado de teste pra pendente — o funil completo (OTP + cadastro) roda de novo">
            ↺ Resetar demo do convidado
          </button>
        </form>
        <span className="dica">
          Volta o convidado de teste (email de testes do Settings) pro estado pré-cadastro, pra rodar o
          funil completo de novo.
        </span>
      </section>
    </>
  );
}
