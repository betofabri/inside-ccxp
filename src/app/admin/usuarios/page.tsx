import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getPersona } from "@/lib/persona";
import { NIVEL_LABEL, PAPEL_OPERACIONAL_LABEL } from "@/lib/labels";
import { criarColaborador, salvarColaborador, alternarAtivoColaborador } from "@/lib/usuarios";
import AdminTabs from "../admin-tabs";

export const dynamic = "force-dynamic";

type Colaborador = {
  id: number;
  nome: string;
  email: string;
  nivel: string;
  papel: string;
  podeCorporativo: boolean;
  isAdmin: boolean;
  ativo: boolean;
};

function CamposColaborador({ c }: { c?: Colaborador }) {
  return (
    <>
      <div className="campo-dupla">
        <div className="campo">
          <label>Nome</label>
          <input type="text" name="nome" defaultValue={c?.nome} placeholder="Nome e sobrenome" required />
        </div>
        <div className="campo">
          <label>Email</label>
          <input type="email" name="email" defaultValue={c?.email} placeholder="nome@omeletecompany.com" required />
        </div>
      </div>
      <div className="campo-dupla">
        <div className="campo">
          <label>Nível</label>
          <select name="nivel" defaultValue={c?.nivel ?? "geral"}>
            <option value="vp_socio">VP / Sócio</option>
            <option value="diretoria">Diretoria</option>
            <option value="geral">Geral</option>
          </select>
        </div>
        <div className="campo">
          <label>Papel</label>
          <select name="papel" defaultValue={c?.papel ?? "host"}>
            <option value="host">Host (convida)</option>
            <option value="producao">Produção (operação)</option>
            <option value="portaria">Portaria (check-in)</option>
          </select>
        </div>
      </div>
      <div className="campo-dupla">
        <label className="check-linha">
          <input type="checkbox" name="podeCorporativo" defaultChecked={c?.podeCorporativo} />
          <span>Corp Invitation On (lote compartilhado)</span>
        </label>
        <label className="check-linha">
          <input type="checkbox" name="isAdmin" defaultChecked={c?.isAdmin} />
          <span>Admin (visão master)</span>
        </label>
      </div>
    </>
  );
}

export default async function PaginaUsuarios({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string; criado?: string; envio?: string }>;
}) {
  const persona = await getPersona();
  if (!persona || persona.role !== "admin") redirect("/");
  const { erro, criado, envio } = await searchParams;

  const colaboradores = await db.funcionario.findMany({ orderBy: [{ ativo: "desc" }, { nome: "asc" }] });

  // métricas por host: cota disponível, convites, resgates e presença confirmada
  const porDono = await db.codigo.groupBy({ by: ["donoId", "status"], _count: true });
  const presencas = await db.codigo.groupBy({
    by: ["donoId"],
    where: { presenteEm: { not: null } },
    _count: true,
  });
  const convites = await db.convite.groupBy({ by: ["hostId"], _count: true });

  const metrica = (id: number) => {
    const meus = porDono.filter((g) => g.donoId === id);
    const soma = (s: string) => meus.find((g) => g.status === s)?._count ?? 0;
    const resgatados = soma("resgatado");
    const presentes = presencas.find((p) => p.donoId === id)?._count ?? 0;
    return {
      cota: soma("disponivel"),
      convites: convites.find((c) => c.hostId === id)?._count ?? 0,
      resgatados,
      comparecimento: resgatados > 0 ? Math.round((presentes / resgatados) * 100) : null,
    };
  };

  return (
    <div className="pagina">
      <h1>Usuários</h1>
      <div className="sub">
        <span>Colaboradores O&CO: papéis, cotas e acesso. Convidado entra por OTP, não por aqui.</span>
      </div>
      <AdminTabs ativa="usuarios" />

      {erro === "campos" && <div className="aviso erro">Preencha nome e um email válido.</div>}
      {erro === "email_em_uso" && <div className="aviso erro">Já existe colaborador com esse email.</div>}
      {erro === "auto_desativar" && (
        <div className="aviso erro">Você não pode desativar a si mesmo — peça a outro admin.</div>
      )}
      {criado && (
        <div className="aviso ok">
          <b>Colaborador criado ✓</b> {criado} adicionado
          {envio === "real"
            ? " e boas-vindas enviadas por email."
            : envio === "mock"
              ? " (email de boas-vindas mockado, sem RESEND_API_KEY)."
              : "; o email de boas-vindas falhou — detalhe no audit log."}
        </div>
      )}

      <details className="secao">
        <summary>
          <h2>
            Convidar colaborador <span className="nota">cria o acesso e manda boas-vindas por email</span>
          </h2>
        </summary>
        <form action={criarColaborador} className="form-passo">
          <CamposColaborador />
          <div className="form-acoes">
            <button className="cta" type="submit">Criar e enviar boas-vindas</button>
          </div>
        </form>
      </details>

      <details className="secao" open>
        <summary>
          <h2>
            Time <span className="nota">{colaboradores.filter((c) => c.ativo).length} ativo(s) · cota e histórico por host</span>
          </h2>
        </summary>
        <div className="lista-usuarios">
          {colaboradores.map((c) => {
            const m = metrica(c.id);
            return (
              <article className={`usuario-card ${c.ativo ? "" : "desativado"}`} key={c.id}>
                <div className="usuario-cab">
                  <div className="usuario-id">
                    <b>{c.nome}</b>
                    <span className="mono dim">{c.email}</span>
                  </div>
                  <div className="usuario-badges">
                    <span className="badge solido">{NIVEL_LABEL[c.nivel] ?? c.nivel}</span>
                    <span className="badge solido">{PAPEL_OPERACIONAL_LABEL[c.papel] ?? c.papel}</span>
                    {c.isAdmin && <span className="badge vip">Admin</span>}
                    {c.podeCorporativo && <span className="badge declarado">Corp On</span>}
                    {!c.ativo && <span className="badge erro">Desativado</span>}
                  </div>
                </div>
                <dl className="usuario-metricas">
                  <div><dt>Cota disponível</dt><dd className="mono">{m.cota}</dd></div>
                  <div><dt>Convites</dt><dd className="mono">{m.convites}</dd></div>
                  <div><dt>Resgatados</dt><dd className="mono">{m.resgatados}</dd></div>
                  <div>
                    <dt>Comparecimento</dt>
                    <dd className="mono">{m.comparecimento === null ? "—" : `${m.comparecimento}%`}</dd>
                  </div>
                </dl>
                <div className="passo-acoes">
                  <details className="editor-passo">
                    <summary className="acao">Editar</summary>
                    <form action={salvarColaborador} className="form-passo">
                      <input type="hidden" name="funcionarioId" value={c.id} />
                      <CamposColaborador c={c} />
                      <div className="form-acoes">
                        <button className="cta" type="submit">Salvar</button>
                      </div>
                    </form>
                  </details>
                  <form action={alternarAtivoColaborador}>
                    <input type="hidden" name="funcionarioId" value={c.id} />
                    <button className={`acao ${c.ativo ? "perigo" : ""}`} type="submit">
                      {c.ativo ? "Desativar acesso" : "Reativar"}
                    </button>
                  </form>
                </div>
              </article>
            );
          })}
        </div>
      </details>
    </div>
  );
}
