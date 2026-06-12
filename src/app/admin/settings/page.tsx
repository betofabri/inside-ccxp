import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getPersona } from "@/lib/persona";
import { salvarConfigs, adicionarDominio, removerDominio } from "@/lib/imports-centrais";
import AdminTabs from "../admin-tabs";
import ImportarCsv from "./importar-csv";

export const dynamic = "force-dynamic";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export default async function PaginaSettings({
  searchParams,
}: {
  searchParams: Promise<{ salvo?: string; erro?: string }>;
}) {
  const persona = await getPersona();
  if (!persona || persona.role !== "admin") redirect("/");
  const { salvo, erro } = await searchParams;

  const configs = Object.fromEntries(
    (await db.config.findMany()).map((c) => [c.chave, c.valor]),
  );
  const dominios = await db.dominioBloqueado.findMany({ orderBy: { dominio: "asc" } });
  const auditoria = await db.auditLog.findMany({ orderBy: { data: "desc" }, take: 8 });
  const atores = new Map(
    (await db.funcionario.findMany()).map((f) => [f.id, f.nome]),
  );

  return (
    <div className="pagina">
      <h1>Settings</h1>
      <div className="sub">
        <span>Imports centrais, exports e configurações do evento.</span>
      </div>
      <AdminTabs ativa="settings" />

      {salvo && <div className="aviso ok"><b>Configurações salvas ✓</b></div>}
      {erro === "dominio" && <div className="aviso erro">Domínio inválido; use o formato empresa.com.</div>}

      <details className="secao" open>
        <summary>
          <h2>
            Import · Resgates confirmados <span className="nota">CSV da Mundo Ticket · marca códigos como resgatados</span>
          </h2>
        </summary>
        <ImportarCsv tipo="resgate" />
      </details>

      <details className="secao">
        <summary>
          <h2>
            Import · Presença <span className="nota">CSV do controle de acesso · match por código ou email</span>
          </h2>
        </summary>
        <ImportarCsv tipo="presenca" />
      </details>

      <details className="secao">
        <summary>
          <h2>
            Exports <span className="nota">CSV com ; e acentos prontos pro Excel</span>
          </h2>
        </summary>
        <div className="exports">
          <a className="cta fantasma" href={`${BASE}/admin/settings/export?tipo=convidados`} download>
            Convidados completo
          </a>
          <a className="cta fantasma" href={`${BASE}/admin/settings/export?tipo=vip`} download>
            Recorte VIP
          </a>
          <a className="cta fantasma" href={`${BASE}/admin/settings/export?tipo=comunicacao`} download>
            Log de comunicação
          </a>
        </div>
      </details>

      <details className="secao">
        <summary>
          <h2>
            Configurações do evento <span className="nota">expiração, links e datas</span>
          </h2>
        </summary>
        <form action={salvarConfigs} className="form-passo" style={{ marginTop: 18 }}>
          <div className="campo-dupla">
            <div className="campo">
              <label>Expiração do convite (dias)</label>
              <input type="number" name="expiracao_dias" min={1} max={60} defaultValue={configs.expiracao_dias ?? "7"} />
            </div>
            <div className="campo">
              <label>Local do evento</label>
              <input type="text" name="evento_local" defaultValue={configs.evento_local ?? ""} />
            </div>
          </div>
          <div className="campo-dupla">
            <div className="campo">
              <label>Início do evento</label>
              <input type="date" name="evento_inicio" defaultValue={configs.evento_inicio ?? ""} />
            </div>
            <div className="campo">
              <label>Fim do evento</label>
              <input type="date" name="evento_fim" defaultValue={configs.evento_fim ?? ""} />
            </div>
          </div>
          <div className="campo">
            <label>Link de resgate (Mundo Ticket)</label>
            <input type="text" name="link_mundo_ticket" defaultValue={configs.link_mundo_ticket ?? ""} />
          </div>
          <div className="campo-dupla">
            <div className="campo">
              <label>Email pra testes do Follow up</label>
              <input type="email" name="email_teste" placeholder="voce@omeletecompany.com" defaultValue={configs.email_teste ?? ""} />
              <div className="dica">Destinatário do botão Testar por email; vazio usa o email do admin logado.</div>
            </div>
            <div className="campo">
              <label>WhatsApp pra testes do Follow up</label>
              <input type="tel" name="whats_teste" placeholder="+55 11 99999-8888" defaultValue={configs.whats_teste ?? ""} />
              <div className="dica">Destinatário do Testar no WhatsApp (Cloud API); no app de teste da Meta, precisa estar na lista de números verificados.</div>
            </div>
          </div>
          <div className="form-acoes">
            <button className="cta" type="submit">Salvar configurações</button>
          </div>
        </form>
      </details>

      <details className="secao">
        <summary>
          <h2>
            Domínios bloqueados <span className="nota">emails genéricos barrados no convite corporativo</span>
          </h2>
        </summary>
        <div className="dominios">
          {dominios.map((d) => (
            <form action={removerDominio} key={d.dominio} className="dominio-chip">
              <input type="hidden" name="dominio" value={d.dominio} />
              <span className="mono">{d.dominio}</span>
              <button type="submit" title={`Desbloquear ${d.dominio}`} aria-label={`Remover ${d.dominio}`}>×</button>
            </form>
          ))}
        </div>
        <form action={adicionarDominio} className="form-dominio">
          <input type="text" name="dominio" placeholder="empresa.com" aria-label="Novo domínio bloqueado" />
          <button className="cta fantasma" type="submit">Bloquear domínio</button>
        </form>
      </details>

      <details className="secao">
        <summary>
          <h2>
            Audit log <span className="nota">últimas 8 operações</span>
          </h2>
        </summary>
        <div className="tabela-wrap">
          <table className="tabela">
            <thead>
              <tr><th>Data</th><th>Ator</th><th>Ação</th><th>Alvo</th><th>Detalhe</th></tr>
            </thead>
            <tbody>
              {auditoria.map((a) => (
                <tr key={a.id}>
                  <td className="dim">{a.data.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}</td>
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
    </div>
  );
}
