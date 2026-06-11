import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getPersona } from "@/lib/persona";
import { TIPOS, TIPO_LABEL, TIPO_DATA, STATUS_CONVITE_LABEL, NIVEL_LABEL, fmtData } from "@/lib/labels";
import NovoConvite from "./novo-convite";

export const dynamic = "force-dynamic";

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

  const tipos = TIPOS.map((tipo) => ({
    tipo,
    label: TIPO_LABEL[tipo],
    data: TIPO_DATA[tipo],
    pessoalDisp: contar(pessoalDisponivel, tipo),
    corpDisp: contar(corpDisponivel, tipo),
  }));

  // visão geral extra pra VP/Head
  const ehVp = host.nivel === "vp_socio";
  const ranking = ehVp
    ? (
        await db.funcionario.findMany({
          include: { convites: { include: { codigos: true } } },
        })
      )
        .map((h) => ({
          nome: h.nome,
          nivel: NIVEL_LABEL[h.nivel],
          convites: h.convites.length,
          ativos: h.convites.filter((cv) => cv.status === "cadastrado" || cv.status === "pendente").length,
          resgatados: h.convites.reduce(
            (acc, cv) => acc + cv.codigos.filter((c) => c.status === "resgatado").length,
            0,
          ),
        }))
        .sort((a, b) => b.convites - a.convites)
    : [];

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
      </div>

      <div className="saldo-strip" aria-label="Saldo pessoal disponível por tipo">
        <span className="legenda">Sua cota:</span>
        {tipos.map((t) => (
          <span className={`saldo-chip ${t.pessoalDisp === 0 ? "zerado" : ""}`} key={t.tipo}>
            <span className="nome-tipo">{t.label}</span>
            <span className="n">{t.pessoalDisp}</span>
          </span>
        ))}
      </div>
      {host.podeCorporativo && (
        <div className="saldo-strip" aria-label="Saldo corporativo disponível por tipo">
          <span className="legenda">Lote corporativo:</span>
          {tipos.map((t) => (
            <span className={`saldo-chip ${t.corpDisp === 0 ? "zerado" : ""}`} key={t.tipo}>
              <span className="nome-tipo">{t.label}</span>
              <span className="n">{t.corpDisp}</span>
            </span>
          ))}
        </div>
      )}

      <NovoConvite podeCorporativo={host.podeCorporativo} tipos={tipos} />

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

      {ehVp && (
        <section className="secao">
          <h2>
            Visão geral do time <span className="nota">exclusivo do nível VP/Head</span>
          </h2>
          <div className="tabela-wrap">
            <table className="tabela">
              <thead>
                <tr>
                  <th>Host</th>
                  <th>Nível</th>
                  <th>Convites</th>
                  <th>Em andamento</th>
                  <th>Códigos resgatados</th>
                </tr>
              </thead>
              <tbody>
                {ranking.map((r) => (
                  <tr key={r.nome}>
                    <td><b>{r.nome}</b></td>
                    <td className="dim">{r.nivel}</td>
                    <td>{r.convites}</td>
                    <td>{r.ativos}</td>
                    <td>{r.resgatados}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
