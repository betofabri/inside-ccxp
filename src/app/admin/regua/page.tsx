import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getPersona } from "@/lib/persona";
import {
  alternarPassoRegua,
  enviarTestePasso,
  salvarPassoRegua,
  criarPassoRegua,
  excluirPassoRegua,
  enviarMensagemAdHoc,
} from "@/lib/regua";
import AdminTabs from "../admin-tabs";

export const dynamic = "force-dynamic";

const CONDICAO_LABEL: Record<string, string> = {
  pular_se_cadastrado: "pula quem já se cadastrou",
  pular_se_resgatado: "pula quem já resgatou (declarado ou confirmado)",
};

const fmtDataRef = (iso: string) =>
  new Date(`${iso}T12:00:00`).toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit" });

type Passo = {
  id: number;
  categoria: string;
  rotulo: string;
  timing: string;
  dataRef: string | null;
  canal: string;
  condicao: string | null;
  assunto: string;
  corpo: string;
  ativo: boolean;
};

function CamposPasso({ passo }: { passo?: Passo }) {
  return (
    <>
      <div className="campo-dupla">
        <div className="campo">
          <label>Nome da etapa</label>
          <input type="text" name="rotulo" defaultValue={passo?.rotulo} placeholder="Ex: Lembrete de resgate" required />
        </div>
        <div className="campo">
          <label>Timing</label>
          <input type="text" name="timing" defaultValue={passo?.timing} placeholder="Ex: D-3, imediato" required />
        </div>
      </div>
      <div className="campo-dupla">
        <div className="campo">
          <label>Data de disparo <span className="opcional">(se ancorada no calendário)</span></label>
          <input type="date" name="dataRef" defaultValue={passo?.dataRef ?? ""} />
        </div>
        <div className="campo">
          <label>Canal</label>
          <select name="canal" defaultValue={passo?.canal ?? "email"}>
            <option value="email">Email</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="email,whatsapp">Email + WhatsApp</option>
          </select>
        </div>
      </div>
      <div className="campo">
        <label>Condição</label>
        <select name="condicao" defaultValue={passo?.condicao ?? ""}>
          <option value="">Sempre envia</option>
          <option value="pular_se_cadastrado">Pular se já cadastrou</option>
          <option value="pular_se_resgatado">Pular se já resgatou</option>
        </select>
      </div>
      <div className="campo">
        <label>Assunto</label>
        <input type="text" name="assunto" defaultValue={passo?.assunto} required />
      </div>
      <div className="campo">
        <label>Mensagem</label>
        <textarea name="corpo" rows={4} defaultValue={passo?.corpo} required />
        <div className="dica">
          Variáveis: {"{{nome}}"} · {"{{host}}"} · {"{{qtd}}"} · {"{{tipos}}"} · {"{{link}}"}
        </div>
      </div>
    </>
  );
}

export default async function PaginaFollowUp({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string; adhoc?: string; teste?: string; canal?: string; envio?: string; dest?: string }>;
}) {
  const persona = await getPersona();
  if (!persona || persona.role !== "admin") redirect("/");
  const { erro, adhoc, teste, canal, envio, dest } = await searchParams;

  const passos = await db.reguaPasso.findMany({ orderBy: { ordem: "asc" } });
  const grupos = [
    {
      chave: "transacional",
      titulo: "Transacionais",
      nota: "todos os convidados · sem opt-out · relativos ao convite",
      passos: passos.filter((p) => p.categoria === "transacional"),
    },
    {
      chave: "regua",
      titulo: "Régua de relacionamento",
      nota: "só convidados corporativos · com opt-out (LGPD) · ancorada no evento",
      passos: passos.filter((p) => p.categoria === "regua"),
    },
    {
      chave: "pos_evento",
      titulo: "Pós-evento",
      nota: "agradecimento, pesquisa e números · fecha o relacionamento",
      passos: passos.filter((p) => p.categoria === "pos_evento"),
    },
  ];

  const CardPasso = ({ passo }: { passo: Passo }) => (
    <article className={`passo-regua ${passo.ativo ? "" : "pausado"}`}>
      <div className="passo-cab">
        <span className="quando-chip">
          {passo.timing}
          {passo.dataRef && <small>{fmtDataRef(passo.dataRef)}</small>}
        </span>
        <div className="passo-titulo">
          <b>{passo.rotulo}</b>
          <span className="canais">
            {passo.canal.split(",").map((c) => (
              <span key={c} className="badge solido">{c === "whatsapp" ? "WhatsApp" : "Email"}</span>
            ))}
          </span>
        </div>
        <div className="passo-controles">
          <form action={enviarTestePasso}>
            <input type="hidden" name="passoId" value={passo.id} />
            <button className="acao" type="submit" title="Dispara este passo só pro seu email (mock)">
              Enviar teste
            </button>
          </form>
          <form action={alternarPassoRegua}>
            <input type="hidden" name="passoId" value={passo.id} />
            <button className={`toggle-passo ${passo.ativo ? "on" : ""}`} type="submit">
              {passo.ativo ? "Ativo" : "Pausado"}
            </button>
          </form>
        </div>
      </div>
      <div className="passo-corpo">
        <div className="assunto">{passo.assunto}</div>
        <p className="mensagem">{passo.corpo}</p>
        {passo.condicao && (
          <span className="badge declarado">Condição: {CONDICAO_LABEL[passo.condicao] ?? passo.condicao}</span>
        )}
        <div className="passo-acoes">
          <details className="editor-passo">
            <summary className="acao">Editar</summary>
            <form action={salvarPassoRegua} className="form-passo">
              <input type="hidden" name="passoId" value={passo.id} />
              <CamposPasso passo={passo} />
              <div className="form-acoes">
                <button className="cta" type="submit">Salvar etapa</button>
              </div>
            </form>
          </details>
          <form action={excluirPassoRegua}>
            <input type="hidden" name="passoId" value={passo.id} />
            <button className="acao perigo" type="submit" title="Remove a etapa da régua">
              Excluir
            </button>
          </form>
        </div>
      </div>
    </article>
  );

  return (
    <div className="pagina">
      <h1>Follow up</h1>
      <div className="sub">
        <span>Régua de comunicação, pós-evento e mensagens avulsas. Disparos mockados; o motor real chega na F4.</span>
      </div>
      <AdminTabs ativa="regua" />

      {erro === "campos" && <div className="aviso erro">Preencha nome, assunto e mensagem da etapa.</div>}
      {teste && envio !== "falha" && (
        <div className="aviso ok">
          <b>Teste enviado ✓</b>{envio === "mock" ? " (mock, sem RESEND_API_KEY)" : " por email de verdade"}:{" "}
          &ldquo;{teste}&rdquo; disparado pra {dest}. Canal configurado:{" "}
          {(canal ?? "email").split(",").map((c) => (c === "whatsapp" ? "WhatsApp" : "email")).join(" e ")}.
        </div>
      )}
      {teste && envio === "falha" && (
        <div className="aviso erro">
          Falha no envio do teste de &ldquo;{teste}&rdquo; pra {dest}; detalhe no audit log (Settings).
        </div>
      )}

      {adhoc && (
        <div className="aviso ok">
          <b>Mensagem enviada ✓</b> (mock) pra {adhoc} convidado(s). Registrada no log de comunicação de cada um.
        </div>
      )}

      <details className="secao">
        <summary>
          <h2>
            Mensagem avulsa <span className="nota">disparo sob demanda · fora da régua</span>
          </h2>
        </summary>
        <form action={enviarMensagemAdHoc} className="form-passo adhoc">
          <div className="campo-dupla">
            <div className="campo">
              <label>Destinatários</label>
              <select name="audiencia" defaultValue="vips">
                <option value="vips">Convidados VIP (convites ativos)</option>
                <option value="todos">Todos os convidados (convites ativos)</option>
              </select>
            </div>
            <div className="campo">
              <label>Canal</label>
              <select name="canal" defaultValue="email">
                <option value="email">Email</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="email,whatsapp">Email + WhatsApp</option>
              </select>
            </div>
          </div>
          <div className="campo">
            <label>Assunto</label>
            <input type="text" name="assunto" placeholder="Ex: Mudança no horário do credenciamento" required />
          </div>
          <div className="campo">
            <label>Mensagem</label>
            <textarea name="corpo" rows={3} placeholder="Texto do disparo. Aceita {{nome}}." required />
          </div>
          <div className="form-acoes">
            <button className="cta" type="submit">Enviar agora</button>
          </div>
        </form>
      </details>

      {grupos.map((g) => (
        <details className="secao" open key={g.chave}>
          <summary>
            <h2>
              {g.titulo} <span className="nota">{g.nota}</span>
            </h2>
          </summary>
          <div className="regua-lista">
            {g.passos.map((p) => (
              <CardPasso passo={p} key={p.id} />
            ))}
            {g.passos.length === 0 && <p className="dica">Nenhuma etapa; adicione a primeira abaixo.</p>}
            <details className="editor-passo nova-etapa">
              <summary className="acao">+ Adicionar etapa</summary>
              <form action={criarPassoRegua} className="form-passo">
                <input type="hidden" name="categoria" value={g.chave} />
                <CamposPasso />
                <div className="form-acoes">
                  <button className="cta" type="submit">Criar etapa</button>
                </div>
              </form>
            </details>
          </div>
        </details>
      ))}
    </div>
  );
}
