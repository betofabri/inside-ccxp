import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getPersona } from "@/lib/persona";
import { TIPO_LABEL, STATUS_CODIGO_LABEL, fmtData } from "@/lib/labels";

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
              <div className={`ticket t-${cod.tipo}`} key={cod.id}>
                <div className="corpo">
                  <div className="tipo">{TIPO_LABEL[cod.tipo]}</div>
                  <div className="codigo">{cod.valor}</div>
                  <div className="origem">Convite de {host}</div>
                  <div className="rodape">
                    <span className={`badge ${cod.status}`}>{STATUS_CODIGO_LABEL[cod.status]}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 28, display: "flex", gap: 14, flexWrap: "wrap" }}>
            <a className="cta" href={linkMundoTicket} target="_blank" rel="noreferrer">
              Resgatar na Mundo Ticket ↗
            </a>
            <button className="cta fantasma" type="button" title="Self-report: funcional na F3">
              Já resgatei ✓
            </button>
          </div>
          <div className="aviso">
            O resgate é feito <b>manualmente no site da Mundo Ticket</b>, com os códigos acima. Depois de{" "}
            resgatar, toque em &ldquo;Já resgatei&rdquo; pra avisar a organização.
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
