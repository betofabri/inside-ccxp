import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getPersona } from "@/lib/persona";
import { TIPO_LABEL, fmtData } from "@/lib/labels";
import Ticket from "./ticket";

export const dynamic = "force-dynamic";

export default async function PaginaConvidado() {
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
      <h1>Sua carteira, {convidado.nome.split(" ")[0]}</h1>
      <div className="sub">
        <span className="mono">{convidado.email ?? convidado.telefone}</span>
        {convidado.consentimentoEm && <span className="badge solido">LGPD ✓ {fmtData(convidado.consentimentoEm)}</span>}
        {convidado.resgateDeclarado && <span className="badge declarado">Resgate declarado</span>}
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
            <span>
              {anfitrioes.length > 1 ? "Seus anfitriões na Omelete:" : "Seu anfitrião na Omelete:"}
            </span>
            {anfitrioes.map((nome) => (
              <span className="badge solido" key={nome}>{nome}</span>
            ))}
          </div>
        ) : null;
      })()}

      {pendentes.length > 0 && (
        <div className="aviso">
          <b>Você tem {pendentes.length} convite(s) aguardando cadastro.</b> Complete o cadastro pelo link
          mágico pra liberar os códigos — eles nunca vão no corpo da mensagem. (Fluxo de cadastro chega na F3.)
        </div>
      )}

      {tickets.length > 0 && (
        <section className="secao">
          <h2>
            Seus ingressos <span className="nota">{tickets.length} código(s), consolidados de todos os convites</span>
          </h2>
          <div className="carteira">
            {tickets.map(({ cod, host }) => (
              <Ticket
                key={cod.id}
                codigoId={cod.id}
                valor={cod.valor}
                tipo={cod.tipo}
                tipoLabel={TIPO_LABEL[cod.tipo]}
                host={host}
              />
            ))}
          </div>

          <div style={{ marginTop: 28 }}>
            <a className="cta" href={linkMundoTicket} target="_blank" rel="noreferrer">
              Resgatar na Mundo Ticket ↗
            </a>
          </div>
          <div className="aviso">
            <b>Toque num código pra copiar</b> e resgate manualmente no site da Mundo Ticket. Os códigos
            que você já copiou ficam marcados aqui na carteira.
          </div>
          <div className="aviso">
            <b>Dica:</b> na aba <a href={`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/apoio`} style={{ textDecoration: "underline" }}>Materiais de Apoio</a>{" "}
            tem mapa do evento, horários, por onde entrar, como chegar e o que levar.
          </div>
        </section>
      )}

      {tickets.length === 0 && pendentes.length === 0 && (
        <div className="aviso">
          <b>Nenhum código ativo na sua carteira.</b> Convites expirados ou cancelados devolvem os códigos ao
          pool.
        </div>
      )}

      {agenda.length > 0 && (
        <section className="secao">
          <h2>
            Agenda do evento <span className="nota">geral única · perfil corporativo</span>
          </h2>
          <div className="agenda">
            {agenda.map((item) => (
              <div className="agenda-item" key={item.id}>
                <div className="quando">
                  {new Date(item.dia + "T12:00:00").toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit" })}
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
