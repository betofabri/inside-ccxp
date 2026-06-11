import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getPersona } from "@/lib/persona";
import { TIPOS, TIPO_LABEL, STATUS_CONVITE_LABEL, NIVEL_LABEL, fmtData } from "@/lib/labels";

export const dynamic = "force-dynamic";

const TIPO_DATA: Record<string, string> = {
  quinta: "quinta, 03/dez",
  sexta: "sexta, 04/dez",
  sabado: "sábado, 05/dez",
  domingo: "domingo, 06/dez",
  todos_os_dias: "acesso aos 4 dias",
};

export default async function PaginaFuncionario() {
  const persona = await getPersona();
  if (!persona || (persona.role !== "funcionario" && persona.role !== "admin")) redirect("/");

  const host = await db.funcionario.findUnique({ where: { id: persona.id } });
  if (!host) redirect("/");

  const pessoalDisponivel = await db.codigo.groupBy({
    by: ["tipo"],
    where: { pool: "pessoal", donoId: host.id, status: "disponivel" },
    _count: true,
  });
  const corpDisponivel = await db.codigo.groupBy({
    by: ["tipo"],
    where: { pool: "corporativo", status: "disponivel" },
    _count: true,
  });

  const meusConvites = await db.convite.findMany({
    where: { hostId: host.id },
    include: { convidado: true, parcelas: true, codigos: true },
    orderBy: { criadoEm: "desc" },
  });

  const contar = (grupos: { tipo: string; _count: number }[], tipo: string) =>
    grupos.find((g) => g.tipo === tipo)?._count ?? 0;

  const saldoPessoalTotal = pessoalDisponivel.reduce((acc, g) => acc + g._count, 0);

  return (
    <div className="pagina">
      <h1>Novo convite</h1>
      <div className="sub">
        <span>
          Olá, <b>{host.nome.split(" ")[0]}</b> · {NIVEL_LABEL[host.nivel]}
        </span>
        {host.podeCorporativo ? (
          <span className="badge declarado">Flag corporativa ativa</span>
        ) : (
          <span className="badge expirado">Cota pessoal apenas</span>
        )}
        <span>{saldoPessoalTotal} códigos pessoais disponíveis</span>
      </div>

      <form className="composer">
        <div className="coluna">
          <h3>Quem você vai convidar</h3>
          <div className="campo">
            <label htmlFor="nome">Nome</label>
            <input id="nome" type="text" placeholder="Nome do convidado" />
          </div>
          <div className="campo">
            <label htmlFor="email">Email</label>
            <input id="email" type="email" placeholder="nome@empresa.com" />
            <div className="dica">
              Parcela corporativa exige email de domínio corporativo; domínios genéricos são bloqueados.
            </div>
          </div>
          <div className="campo">
            <label htmlFor="whatsapp">WhatsApp <span style={{ color: "var(--faint)", fontWeight: 400 }}>(opcional)</span></label>
            <input id="whatsapp" type="tel" placeholder="+55 11 9 0000-0000" />
          </div>
          {host.podeCorporativo && (
            <label className="vip-toggle">
              <input type="checkbox" />
              <span className="texto">
                VIP Omelete
                <small>Marca o convidado pro recorte VIP do evento. O admin pode editar depois.</small>
              </span>
            </label>
          )}
        </div>

        <div className="coluna">
          <h3>Ingressos por dia</h3>
          <div className="parcelas">
            {TIPOS.map((tipo) => {
              const pess = contar(pessoalDisponivel, tipo);
              const corp = contar(corpDisponivel, tipo);
              return (
                <div className="parcela-linha" key={tipo}>
                  <div className="dia">
                    {TIPO_LABEL[tipo]}
                    <small>{TIPO_DATA[tipo]}</small>
                  </div>
                  <div className="pool-campo">
                    <span className="rotulo">
                      <b>Pessoal</b>
                      {pess} disponíveis
                    </span>
                    <input type="number" min={0} max={pess} defaultValue={0} disabled={pess === 0} aria-label={`Pessoal ${TIPO_LABEL[tipo]}`} />
                  </div>
                  <div className="pool-campo">
                    <span className="rotulo">
                      <b>Corporativo</b>
                      {host.podeCorporativo ? `restam ${corp}` : "sem flag"}
                    </span>
                    <input type="number" min={0} max={corp} defaultValue={0} disabled={!host.podeCorporativo || corp === 0} aria-label={`Corporativo ${TIPO_LABEL[tipo]}`} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rodape">
          <span className="nota">
            Convite só pessoal aceita email ou WhatsApp; com parcela corporativa, o email é obrigatório.
          </span>
          <button className="cta" type="button" disabled title="O envio chega na F2">
            Enviar convite
          </button>
        </div>
      </form>

      <section className="secao">
        <h2>
          Meus convites <span className="nota">reenvio, cancelamento e import de resgate chegam na F2</span>
        </h2>
        <div className="tabela-wrap">
          <table className="tabela">
            <thead>
              <tr>
                <th>Convidado</th>
                <th>Contato</th>
                <th>Ingressos</th>
                <th>Status</th>
                <th>Expira</th>
                <th>VIP</th>
              </tr>
            </thead>
            <tbody>
              {meusConvites.map((cv) => (
                <tr key={cv.id}>
                  <td><b>{cv.convidado.nome}</b></td>
                  <td className="mono dim">{cv.convidado.email ?? cv.convidado.telefone ?? "—"}</td>
                  <td className="dim">
                    {cv.parcelas
                      .map((p) => `${p.qtd}× ${TIPO_LABEL[p.tipo]} ${p.pool === "corporativo" ? "corp." : "pessoal"}`)
                      .join(" + ")}
                    {cv.codigos.length === 0 && " · devolvidos ao pool"}
                  </td>
                  <td>
                    <span className={`badge ${cv.status}`}>{STATUS_CONVITE_LABEL[cv.status]}</span>
                  </td>
                  <td className="dim">{fmtData(cv.expiraEm)}</td>
                  <td>{cv.vipOmelete ? <span className="badge vip">VIP</span> : <span className="dim">—</span>}</td>
                </tr>
              ))}
              {meusConvites.length === 0 && (
                <tr>
                  <td colSpan={6} className="dim">
                    Você ainda não convidou ninguém. O formulário acima é o caminho.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
