import { db } from "@/lib/db";
import { assumirPersona } from "@/lib/actions";
import { resetarDemoConvidado, resetarDemoHost } from "@/lib/demo";
import { NIVEL_LABEL } from "@/lib/labels";
import { getT } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{
    reset?: string;
    qtd?: string;
    token?: string;
    erro?: string;
    resethost?: string;
    convites?: string;
    apagados?: string;
  }>;
}) {
  const { reset, qtd, token, erro, resethost, convites, apagados } = await searchParams;
  const { t } = await getT();
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
          {t.hub.heroPre} <em>{t.hub.heroEm}</em>
        </h1>
        <div className="evento">
          <span><b>CCXP26</b></span>
          <span>{t.evento.datas}</span>
          <span>{t.evento.local}</span>
          <span>{t.hub.escolha}</span>
        </div>
        <div className="hero-ctas">
          <a className="cta" href="#personas">{t.hub.souHost}</a>
          <a className="cta fantasma" href={`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/acesso`}>
            {t.hub.souConvidado}
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
            {t.hub.colabTitulo} <span className="num">host</span>
          </header>
          <p className="desc">{t.hub.colabDesc}</p>
          <ul>
            {hosts.map((f) => (
              <li key={f.id}>
                <form action={assumirPersona}>
                  <input type="hidden" name="role" value="funcionario" />
                  <input type="hidden" name="id" value={f.id} />
                  <button className="persona-btn" type="submit">
                    <span className="nome">{f.nome}</span>
                    <span className="meta">
                      {NIVEL_LABEL[f.nivel]} · {f.podeCorporativo ? t.hub.comFlag : t.hub.semFlag}
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
            {t.hub.convTitulo} <span className="num">vip</span>
          </header>
          <p className="desc">
            {t.hub.convDesc} {t.hub.jaCadastrou}{" "}
            <a href={`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/acesso`} style={{ textDecoration: "underline" }}>{t.hub.entreComCodigo}</a>.
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
                        ? t.hub.convitesN(c.convites.length)
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
        {resethost === "ok" && (
          <div className="aviso ok">
            <b>Camila Ramos zerada ✓</b> {convites} convite(s) apagado(s){apagados && Number(apagados) > 0 ? ` e ${apagados} convidado(s) removido(s)` : ""}; a cota dela voltou cheia ao pool. Entre como Camila e simule o fluxo do zero.
          </div>
        )}
        {resethost === "sem_host" && (
          <div className="aviso erro">Host &ldquo;Camila Ramos&rdquo; não encontrado na base.</div>
        )}
        <div className="reset-acoes">
          <form action={resetarDemoHost}>
            <button
              className="acao"
              type="submit"
              title="Apaga todos os convites e convidados da Camila e devolve a cota dela ao pool — host volta a zero"
            >
              ↺ Resetar Camila (host)
            </button>
          </form>
          <form action={resetarDemoConvidado}>
            <button
              className="acao"
              type="submit"
              title="Volta os convites cadastrados do convidado de teste pra pendente — o funil completo (OTP + cadastro) roda de novo"
            >
              ↺ Resetar convidado de teste
            </button>
          </form>
        </div>
        <span className="dica">
          <b>Camila (host):</b> zera tudo dela (códigos + convidados) pra simular o envio do começo.{" "}
          <b>Convidado de teste:</b> volta quem tem o email de testes pro estado pré-cadastro.
        </span>
      </section>
    </>
  );
}
