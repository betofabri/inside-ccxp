import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getPersona } from "@/lib/persona";
import { alternarPassoRegua } from "@/lib/regua";
import AdminTabs from "../admin-tabs";

export const dynamic = "force-dynamic";

const CONDICAO_LABEL: Record<string, string> = {
  pular_se_cadastrado: "pula quem já se cadastrou",
  pular_se_resgatado: "pula quem já resgatou (declarado ou confirmado)",
};

const fmtDataRef = (iso: string) =>
  new Date(`${iso}T12:00:00`).toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit" });

export default async function PaginaRegua() {
  const persona = await getPersona();
  if (!persona || persona.role !== "admin") redirect("/");

  const passos = await db.reguaPasso.findMany({ orderBy: [{ categoria: "desc" }, { ordem: "asc" }] });
  const transacionais = passos.filter((p) => p.categoria === "transacional");
  const relacionamento = passos.filter((p) => p.categoria === "regua");

  const Passo = ({ passo }: { passo: (typeof passos)[number] }) => (
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
        <form action={alternarPassoRegua}>
          <input type="hidden" name="passoId" value={passo.id} />
          <button className={`toggle-passo ${passo.ativo ? "on" : ""}`} type="submit">
            {passo.ativo ? "Ativo" : "Pausado"}
          </button>
        </form>
      </div>
      <div className="passo-corpo">
        <div className="assunto">{passo.assunto}</div>
        <p className="mensagem">{passo.corpo}</p>
        {passo.condicao && (
          <span className="badge declarado">Condição: {CONDICAO_LABEL[passo.condicao] ?? passo.condicao}</span>
        )}
      </div>
    </article>
  );

  return (
    <div className="pagina">
      <h1>Régua de comunicação</h1>
      <div className="sub">
        <span>Disparos mockados no protótipo; o motor real chega na F4.</span>
      </div>
      <AdminTabs ativa="regua" />

      <div className="aviso">
        Variáveis disponíveis nos templates: <b>{"{{nome}}"}</b>, <b>{"{{host}}"}</b>, <b>{"{{qtd}}"}</b>,{" "}
        <b>{"{{tipos}}"}</b>, <b>{"{{link}}"}</b>. Quem cadastra depois de um passo já disparado não recebe
        retroativo; entra no próximo.
      </div>

      <details className="secao" open>
        <summary>
          <h2>
            Transacionais <span className="nota">todos os convidados · sem opt-out · relativos ao convite</span>
          </h2>
        </summary>
        <div className="regua-lista">
          {transacionais.map((p) => (
            <Passo passo={p} key={p.id} />
          ))}
        </div>
      </details>

      <details className="secao" open>
        <summary>
          <h2>
            Régua de relacionamento{" "}
            <span className="nota">só convidados corporativos · com opt-out (LGPD) · ancorada no evento</span>
          </h2>
        </summary>
        <div className="regua-lista">
          {relacionamento.map((p) => (
            <Passo passo={p} key={p.id} />
          ))}
        </div>
      </details>
    </div>
  );
}
