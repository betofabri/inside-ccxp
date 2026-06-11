import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getPersona } from "@/lib/persona";
import { TIPOS, TIPO_LABEL, STATUS_CONVITE_LABEL, NIVEL_LABEL, fmtData } from "@/lib/labels";

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
  const pessoalTotal = await db.codigo.groupBy({
    by: ["tipo"],
    where: { pool: "pessoal", donoId: host.id },
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

  return (
    <div className="pagina">
      <h1>Olá, {host.nome.split(" ")[0]}</h1>
      <div className="sub">
        <span className="badge solido">{NIVEL_LABEL[host.nivel]}</span>
        {host.podeCorporativo ? (
          <span className="badge vip">FLAG CORPORATIVA</span>
        ) : (
          <span className="badge expirado">SEM FLAG CORPORATIVA</span>
        )}
        <span>{host.email}</span>
      </div>

      <section className="secao">
        <h2>
          Saldo pessoal <span className="nota">códigos disponíveis / total da sua planilha</span>
        </h2>
        <div className="saldos">
          {TIPOS.map((tipo) => {
            const disp = contar(pessoalDisponivel, tipo);
            return (
              <div className="saldo" key={tipo}>
                <div className="tipo">{TIPO_LABEL[tipo]}</div>
                <div className={`qtd ${disp === 0 ? "zerado" : ""}`}>{disp}</div>
                <div className="de">de {contar(pessoalTotal, tipo)}</div>
              </div>
            );
          })}
        </div>
      </section>

      {host.podeCorporativo ? (
        <section className="secao">
          <h2>
            Pool corporativo <span className="nota">lote compartilhado — restam X por tipo</span>
          </h2>
          <div className="saldos">
            {TIPOS.map((tipo) => {
              const disp = contar(corpDisponivel, tipo);
              return (
                <div className="saldo" key={tipo}>
                  <div className="tipo">{TIPO_LABEL[tipo]}</div>
                  <div className={`qtd ${disp === 0 ? "zerado" : ""}`}>{disp}</div>
                  <div className="de">restantes</div>
                </div>
              );
            })}
          </div>
        </section>
      ) : (
        <div className="aviso">
          <b>Você não tem a flag corporativa.</b> Seus convites usam só a cota pessoal. A flag é atribuída pelo
          admin, por pessoa.
        </div>
      )}

      <section className="secao">
        <h2>
          Meus convites <span className="nota">criar convite, reenvio e import de resgate chegam na F2</span>
        </h2>
        <div className="tabela-wrap">
          <table className="tabela">
            <thead>
              <tr>
                <th>Convidado</th>
                <th>Contato</th>
                <th>Parcelas</th>
                <th>Códigos</th>
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
                  <td className="mono">
                    {cv.parcelas
                      .map((p) => `${p.qtd}× ${TIPO_LABEL[p.tipo]} (${p.pool === "corporativo" ? "corp" : "pessoal"})`)
                      .join(" + ")}
                  </td>
                  <td className="mono dim">
                    {cv.codigos.length > 0 ? `${cv.codigos.length} vinculado(s)` : "devolvidos ao pool"}
                  </td>
                  <td>
                    <span className={`badge ${cv.status}`}>{STATUS_CONVITE_LABEL[cv.status]}</span>
                  </td>
                  <td className="mono dim">{fmtData(cv.expiraEm)}</td>
                  <td>{cv.vipOmelete ? <span className="badge vip">VIP</span> : <span className="dim">—</span>}</td>
                </tr>
              ))}
              {meusConvites.length === 0 && (
                <tr>
                  <td colSpan={7} className="dim">Nenhum convite ainda.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
