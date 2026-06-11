import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getPersona } from "@/lib/persona";
import { TIPOS, TIPO_LABEL, STATUS_CONVITE_LABEL, fmtData } from "@/lib/labels";
import AdminTabs from "./admin-tabs";
import ImportarPlanilha from "../funcionario/importar-planilha";
import { FunilEvento, PizzaResgates } from "./graficos-cliente";

export const dynamic = "force-dynamic";

export default async function PaginaAdmin() {
  const persona = await getPersona();
  if (!persona || persona.role !== "admin") redirect("/");

  const admin = await db.funcionario.findUnique({ where: { id: persona.id } });
  if (!admin?.isAdmin) redirect("/");

  // ── Funil (4 etapas: convidados → cadastrados → resgatados → presentes) ──
  const totalConvidados = await db.convidado.count();
  const cadastrados = await db.convidado.count({ where: { consentimentoEm: { not: null } } });
  const resgatados = await db.convidado.count({
    where: { convites: { some: { codigos: { some: { status: "resgatado" } } } } },
  });
  const presentes = await db.convidado.count({
    where: { convites: { some: { codigos: { some: { presenteEm: { not: null } } } } } },
  });

  // ── Pool corporativo ──
  const corpDisponivel = await db.codigo.groupBy({
    by: ["tipo"],
    where: { pool: "corporativo", status: "disponivel" },
    _count: true,
  });
  const corpTotal = await db.codigo.groupBy({
    by: ["tipo"],
    where: { pool: "corporativo" },
    _count: true,
  });

  // ── Ranking de hosts ──
  const hosts = await db.funcionario.findMany({
    include: { convites: { include: { codigos: true } } },
  });
  const ranking = hosts
    .map((h) => ({
      nome: h.nome,
      convites: h.convites.length,
      resgatados: h.convites.reduce(
        (acc, cv) => acc + cv.codigos.filter((c) => c.status === "resgatado").length,
        0,
      ),
    }))
    .sort((a, b) => b.convites - a.convites);

  // ── Convidados ──
  const convidados = await db.convidado.findMany({
    include: { convites: { include: { host: true, codigos: true } } },
    orderBy: { id: "asc" },
  });

  // ── Ranking de empresas (campo empresa; fallback: domínio do email) ──
  const porEmpresa = new Map<
    string,
    { nome: string; dominio: string; convidados: number; codigos: number; vips: number }
  >();
  for (const c of convidados) {
    const dominio = c.email?.split("@")[1]?.toLowerCase() ?? "";
    const nome =
      c.empresa?.trim() ||
      (dominio ? dominio.split(".")[0].replace(/^./, (l) => l.toUpperCase()) : "");
    if (!nome) continue;
    const chave = nome.toLowerCase();
    const atual = porEmpresa.get(chave) ?? { nome, dominio, convidados: 0, codigos: 0, vips: 0 };
    atual.convidados += 1;
    atual.codigos += c.convites.reduce((acc, cv) => acc + cv.codigos.length, 0);
    if (c.convites.some((cv) => cv.vipOmelete)) atual.vips += 1;
    if (!atual.dominio && dominio) atual.dominio = dominio;
    porEmpresa.set(chave, atual);
  }
  const empresas = [...porEmpresa.values()].sort(
    (a, b) => b.codigos - a.codigos || b.convidados - a.convidados,
  );

  const auditoria = await db.auditLog.findMany({ orderBy: { data: "desc" }, take: 10 });
  const atores = new Map(hosts.map((h) => [h.id, h.nome]));
  const configs = await db.config.findMany();

  const contar = (grupos: { tipo: string; _count: number }[], tipo: string) =>
    grupos.find((g) => g.tipo === tipo)?._count ?? 0;

  return (
    <div className="pagina">
      <h1>Painel admin</h1>
      <div className="sub">
        <span className="badge vip">Master</span>
        <span>{admin.nome} · visão completa do sistema</span>
      </div>
      <AdminTabs ativa="dashboard" />

      <details className="secao" open>
        <summary><h2>
          Funil <span className="nota">passe o mouse pra ver a conversão de cada etapa</span>
        </h2></summary>
        <FunilEvento
          etapas={[
            { nome: "Convidados", valor: totalConvidados },
            { nome: "Cadastrados", valor: cadastrados },
            { nome: "Resgatados", valor: resgatados },
            { nome: "Presentes", valor: presentes },
          ]}
        />
      </details>

      <details className="secao" open>
        <summary><h2>
          Resgates Corporativos <span className="nota">consumo do lote por tipo · passe o mouse nas fatias</span>
        </h2></summary>
        <PizzaResgates
          fatias={TIPOS.map((tipo) => {
            const total = contar(corpTotal, tipo);
            return { tipo, total, usados: total - contar(corpDisponivel, tipo) };
          })}
        />
      </details>

      <details className="secao">
        <summary><h2>
          Ranking de hosts <span className="nota">quem convidou quantos · resgates confirmados</span>
        </h2></summary>
        <div className="tabela-wrap">
          <table className="tabela">
            <thead>
              <tr>
                <th>#</th>
                <th>Host</th>
                <th>Convites</th>
                <th>Códigos resgatados</th>
              </tr>
            </thead>
            <tbody>
              {ranking.map((r, i) => (
                <tr key={r.nome}>
                  <td className="mono dim">{i + 1}</td>
                  <td><b>{r.nome}</b></td>
                  <td className="mono">{r.convites}</td>
                  <td className="mono">{r.resgatados}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>

      <details className="secao">
        <summary><h2>
          Empresas convidadas <span className="nota">derivado do domínio do email</span>
        </h2></summary>
        <div className="tabela-wrap">
          <table className="tabela">
            <thead>
              <tr>
                <th>#</th>
                <th>Empresa</th>
                <th>Domínio</th>
                <th>Convidados</th>
                <th>Ingressos</th>
                <th>VIPs</th>
              </tr>
            </thead>
            <tbody>
              {empresas.map((e, i) => (
                <tr key={e.nome}>
                  <td className="dim">{i + 1}</td>
                  <td><b>{e.nome}</b></td>
                  <td className="mono dim">{e.dominio || "—"}</td>
                  <td>{e.convidados}</td>
                  <td>{e.codigos}</td>
                  <td>{e.vips > 0 ? <span className="badge vip">{e.vips}</span> : <span className="dim">—</span>}</td>
                </tr>
              ))}
              {empresas.length === 0 && (
                <tr>
                  <td colSpan={6} className="dim">Nenhum convidado com email corporativo ainda.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </details>

      <details className="secao">
        <summary><h2>
          Convidados <span className="nota">filtro VIP, busca e exports chegam na F5</span>
        </h2></summary>
        <div className="tabela-wrap">
          <table className="tabela">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Contato</th>
                <th>Origem</th>
                <th>Códigos</th>
                <th>Status</th>
                <th>VIP</th>
              </tr>
            </thead>
            <tbody>
              {convidados.map((c) => {
                const vip = c.convites.some((cv) => cv.vipOmelete);
                const codigos = c.convites.flatMap((cv) => cv.codigos);
                return (
                  <tr key={c.id}>
                    <td><b>{c.nome}</b></td>
                    <td className="mono dim">{c.email ?? c.telefone ?? "—"}</td>
                    <td className="dim">
                      {[...new Set(c.convites.map((cv) => cv.host.nome))].join(" + ") || "—"}
                    </td>
                    <td className="mono dim">{codigos.length}</td>
                    <td style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {[...new Set(c.convites.map((cv) => cv.status))].map((s) => (
                        <span key={s} className={`badge ${s}`}>{STATUS_CONVITE_LABEL[s]}</span>
                      ))}
                      {c.resgateDeclarado && <span className="badge declarado">Declarou resgate</span>}
                    </td>
                    <td>{vip ? <span className="badge vip">VIP</span> : <span className="dim">—</span>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </details>

      <details className="secao">
        <summary><h2>
          Importar lote corporativo <span className="nota">planilha central · só admin · formato oficial</span>
        </h2></summary>
        <ImportarPlanilha pool="corporativo" eventoEsperado="CCXP26" />
      </details>

      <details className="secao">
        <summary><h2>
          Audit log <span className="nota">últimas 10 operações</span>
        </h2></summary>
        <div className="tabela-wrap">
          <table className="tabela">
            <thead>
              <tr>
                <th>Data</th>
                <th>Ator</th>
                <th>Ação</th>
                <th>Alvo</th>
                <th>Detalhe</th>
              </tr>
            </thead>
            <tbody>
              {auditoria.map((a) => (
                <tr key={a.id}>
                  <td className="mono dim">{fmtData(a.data)}</td>
                  <td>{a.atorId ? atores.get(a.atorId) ?? a.atorId : "sistema"}</td>
                  <td className="mono">{a.acao}</td>
                  <td className="mono dim">{a.alvo}</td>
                  <td className="dim">{a.detalhe}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>

      <details className="secao">
        <summary><h2>
          Configuração <span className="nota">edição chega na F5</span>
        </h2></summary>
        <div className="tabela-wrap">
          <table className="tabela">
            <tbody>
              {configs.map((c) => (
                <tr key={c.chave}>
                  <td className="mono dim">{c.chave}</td>
                  <td className="mono">{c.valor}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
