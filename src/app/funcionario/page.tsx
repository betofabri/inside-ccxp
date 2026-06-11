import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getPersona } from "@/lib/persona";
import { TIPOS, TIPO_LABEL, TIPO_DATA, STATUS_CONVITE_LABEL, fmtData } from "@/lib/labels";
import NovoConvite from "./novo-convite";
import AcoesConvite from "./acoes-convite";
import ImportarBotao from "./importar-botao";
import { expirarVencidos } from "@/lib/convites";

export const dynamic = "force-dynamic";

export default async function PaginaFuncionario() {
  const persona = await getPersona();
  if (!persona || (persona.role !== "funcionario" && persona.role !== "admin")) redirect("/");

  await expirarVencidos();

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


  return (
    <div className="pagina">
      <h1>Novo convite</h1>
      <div style={{ marginTop: 14 }}>
        <ImportarBotao pool="pessoal" eventoEsperado="CCXP26" />
      </div>

      <div className="estoque">
        <div className="estoque-cab">
          <span className="titulo">Ingressos disponíveis</span>
          <span className="chave">
            <b className="p">cota pessoal</b>
            {host.podeCorporativo && (
              <>
                {" | "}
                <b className="c">cota corporativa</b>
              </>
            )}
          </span>
        </div>
        <div className="saldo-strip">
          {tipos.map((t) => (
            <span className={`saldo-chip t-${t.tipo}`} key={t.tipo}>
              <span className="nome-tipo">{t.label}</span>
              <span className="par">
                <small>pess.</small>
                <span className={`n p ${t.pessoalDisp === 0 ? "zerado" : ""}`}>{t.pessoalDisp}</span>
              </span>
              {host.podeCorporativo && (
                <>
                  <span className="sep" aria-hidden />
                  <span className="par">
                    <small>corp.</small>
                    <span className={`n c ${t.corpDisp === 0 ? "zerado" : ""}`}>{t.corpDisp}</span>
                  </span>
                </>
              )}
            </span>
          ))}
        </div>
      </div>

      <NovoConvite
        podeCorporativo={host.podeCorporativo}
        tipos={tipos}
        empresas={[
          ...new Set(
            (await db.convidado.findMany({ where: { empresa: { not: null } }, select: { empresa: true } }))
              .map((c) => c.empresa as string)
              .sort(),
          ),
        ]}
        anteriores={(
          await db.convidado.findMany({
            // menor privilégio: host só vê quem ele mesmo convidou; admin vê todos
            where: persona.role === "admin" ? {} : { convites: { some: { hostId: host.id } } },
            include: { convites: { where: { status: { in: ["pendente", "cadastrado"] } } } },
            orderBy: { id: "desc" },
          })
        ).map((c) => ({
          id: c.id,
          nome: c.nome,
          empresa: c.empresa,
          email: c.email,
          telefone: c.telefone,
          ativos: c.convites.length,
        }))}
      />

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
                <th>Ações</th>
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
                  <td>
                    <AcoesConvite conviteId={cv.id} token={cv.magicToken} status={cv.status} />
                  </td>
                </tr>
              ))}
              {meusConvites.length === 0 && (
                <tr>
                  <td colSpan={7} className="dim">
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
