import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getPersona } from "@/lib/persona";
import { TIPO_LABEL } from "@/lib/labels";
import Ticket from "./ticket";
import Confetes from "@/components/confetes";
import { getT } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function PaginaConvidado({
  searchParams,
}: {
  searchParams: Promise<{ cadastro?: string; interesses?: string }>;
}) {
  const { cadastro, interesses } = await searchParams;
  const { t, L } = await getT();
  const localeData = L === "pt" ? "pt-BR" : L === "es" ? "es-ES" : "en-US";
  const persona = await getPersona();
  if (!persona || persona.role !== "convidado") redirect("/");

  const convidado = await db.convidado.findUnique({
    where: { id: persona.id },
    include: {
      convites: {
        include: { host: true, codigos: true, parcelas: true },
        orderBy: { criadoEm: "asc" },
      },
    },
  });
  if (!convidado) redirect("/");

  const linkMundoTicket =
    (await db.config.findUnique({ where: { chave: "link_mundo_ticket" } }))?.valor ?? "#";

  // carteira consolidada: códigos de todos os convites ativos, com origem
  const tickets = convidado.convites
    .filter((cv) => cv.status === "cadastrado")
    .flatMap((cv) => cv.codigos.map((cod) => ({ cod, host: cv.host.nome })));

  const pendentes = convidado.convites.filter((cv) => cv.status === "pendente");
  const corporativo = convidado.convites.some((cv) =>
    cv.parcelas.some((p) => p.pool === "corporativo"),
  );

  const agenda = corporativo
    ? await db.agendaItem.findMany({ orderBy: [{ dia: "asc" }, { horario: "asc" }] })
    : [];

  return (
    <div className="pagina">
      {cadastro === "ok" && <Confetes />}
      {cadastro === "ok" && (
        <div className="aviso ok">
          <b>{t.carteira.cadastroOkB}</b> {t.carteira.cadastroOk}
        </div>
      )}
      {interesses === "ok" && (
        <div className="aviso ok">
          <b>{t.carteira.interessesOkB}</b> {t.carteira.interessesOk}
        </div>
      )}
      {!convidado.interesses && cadastro !== "ok" && (
        <div className="aviso">
          <b>{t.carteira.pesquisaB}</b> {t.carteira.pesquisaPre}{" "}
          <a
            href={`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/convidado/interesses?origem=carteira`}
            style={{ textDecoration: "underline" }}
          >
            {t.carteira.pesquisaLink}
          </a>{" "}
          {t.carteira.pesquisaPos}
        </div>
      )}
      <h1>{t.carteira.titulo(convidado.nome.split(" ")[0])}</h1>
      <div className="sub">
        <span className="mono">{convidado.email ?? convidado.telefone}</span>
        {convidado.consentimentoEm && (
          <span className="badge solido">
            {t.carteira.lgpd(convidado.consentimentoEm.toLocaleDateString(localeData, { day: "2-digit", month: "2-digit", year: "numeric" }))}
          </span>
        )}
        {convidado.resgateDeclarado && <span className="badge declarado">{t.carteira.resgateDecl}</span>}
      </div>

      {(() => {
        const anfitrioes = [
          ...new Set(
            convidado.convites
              .filter((cv) => cv.status !== "cancelado")
              .map((cv) => cv.host.nome),
          ),
        ];
        return anfitrioes.length > 0 ? (
          <div className="sub anfitrioes">
            <span>{anfitrioes.length > 1 ? t.carteira.anfitriaoVarios : t.carteira.anfitriaoUm}</span>
            {anfitrioes.map((nome) => (
              <span className="badge solido" key={nome}>{nome}</span>
            ))}
          </div>
        ) : null;
      })()}

      {tickets.length > 0 && (
        <section className="secao">
          <h2>
            {t.carteira.ingressos} <span className="nota">{t.carteira.ingressosNota(tickets.length)}</span>
          </h2>
          <div className="carteira">
            {tickets.map(({ cod, host }) => (
              <Ticket
                key={cod.id}
                codigoId={cod.id}
                valor={cod.valor}
                tipo={cod.tipo}
                tipoLabel={TIPO_LABEL[cod.tipo]}
                labels={{
                  de: t.ticket.de(host),
                  copiar: t.ticket.copiar,
                  copiado: t.ticket.copiado,
                  codigoCopiado: t.ticket.codigoCopiado,
                  disponivel: t.ticket.disponivel,
                }}
              />
            ))}
          </div>

          <div style={{ marginTop: 28 }}>
            <a className="cta" href={linkMundoTicket} target="_blank" rel="noreferrer">
              {t.carteira.resgatar}
            </a>
          </div>
          <div className="aviso">
            <b>{t.carteira.copiarB}</b> {t.carteira.copiarTexto}
          </div>
          <div className="aviso">
            <b>{t.carteira.mtB}</b> {t.carteira.mtTexto}{" "}
            <a
              href="https://ajuda.ccxp.com.br/hc/pt-br/articles/4411868666637-Recebi-um-c%C3%B3digo-de-cortesia-como-resgatar-o-ingresso"
              target="_blank"
              rel="noreferrer"
              style={{ textDecoration: "underline" }}
            >
              {t.carteira.mtLink}
            </a>{" "}
            {t.carteira.mtPos}
          </div>
          <div className="aviso">
            <b>{t.carteira.dicaB}</b> {t.carteira.dicaPre}{" "}
            <a href={`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/apoio`} style={{ textDecoration: "underline" }}>{t.header.assets}</a>{" "}
            {t.carteira.dicaPos}
          </div>
        </section>
      )}

      {tickets.length === 0 && pendentes.length === 0 && (
        <div className="aviso">
          <b>{t.carteira.semCodigosB}</b> {t.carteira.semCodigos}
        </div>
      )}

      {agenda.length > 0 && (
        <section className="secao">
          <h2>
            {t.carteira.agenda} <span className="nota">{t.carteira.agendaNota}</span>
          </h2>
          <div className="agenda">
            {agenda.map((item) => (
              <div className="agenda-item" key={item.id}>
                <div className="quando">
                  {new Date(item.dia + "T12:00:00").toLocaleDateString(localeData, { weekday: "short", day: "2-digit", month: "2-digit" })}
                  {" · "}
                  {item.horario}
                </div>
                <div>
                  <div className="titulo">{item.titulo}</div>
                  <div className="desc">{item.descricao}</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
