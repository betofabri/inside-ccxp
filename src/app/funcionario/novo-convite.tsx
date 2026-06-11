"use client";

import { useState } from "react";

type TipoInfo = {
  tipo: string;
  label: string;
  data: string;
  pessoalDisp: number;
  corpDisp: number;
};

type Props = {
  podeCorporativo: boolean;
  tipos: TipoInfo[];
};

type Qtd = { pessoal: number; corporativo: number };

const PASSOS = ["Convidado", "Ingressos", "Revisão"];

export default function NovoConvite({ podeCorporativo, tipos }: Props) {
  const [passo, setPasso] = useState(0);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [vip, setVip] = useState(false);
  const [qtd, setQtd] = useState<Record<string, Qtd>>(
    Object.fromEntries(tipos.map((t) => [t.tipo, { pessoal: 0, corporativo: 0 }])),
  );

  const setQuantidade = (tipo: string, pool: keyof Qtd, valor: number, max: number) =>
    setQtd((q) => ({ ...q, [tipo]: { ...q[tipo], [pool]: Math.max(0, Math.min(max, valor)) } }));

  const totalPessoal = tipos.reduce((acc, t) => acc + qtd[t.tipo].pessoal, 0);
  const totalCorp = tipos.reduce((acc, t) => acc + qtd[t.tipo].corporativo, 0);
  const total = totalPessoal + totalCorp;

  const contatoOk = nome.trim().length > 1 && (email.trim().length > 3 || whatsapp.trim().length > 7);
  const corpSemEmail = totalCorp > 0 && email.trim().length <= 3;

  const podeAvancar = passo === 0 ? contatoOk : passo === 1 ? total > 0 : false;

  const linhasResumo = tipos.flatMap((t) =>
    (["pessoal", "corporativo"] as const)
      .filter((pool) => qtd[t.tipo][pool] > 0)
      .map((pool) => ({
        chave: `${t.tipo}-${pool}`,
        texto: `${qtd[t.tipo][pool]}× ${t.label}`,
        pool: pool === "corporativo" ? "corporativo" : "pessoal",
      })),
  );

  return (
    <div className="composer wizard">
      <ol className="passos">
        {PASSOS.map((rotulo, i) => (
          <li
            key={rotulo}
            className={`passo ${i === passo ? "atual" : ""} ${i < passo ? "feito" : ""}`}
            aria-current={i === passo ? "step" : undefined}
          >
            <span className="bolinha">{i < passo ? "✓" : i + 1}</span>
            {rotulo}
          </li>
        ))}
      </ol>

      {passo === 0 && (
        <div className="painel" key="p0">
          <h3>Quem você vai convidar</h3>
          <div className="campo">
            <label htmlFor="nome">Nome</label>
            <input
              id="nome"
              type="text"
              placeholder="Nome do convidado"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              autoFocus
            />
          </div>
          <div className="campo">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              placeholder="nome@empresa.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <div className="dica">
              Parcela corporativa exige email de domínio corporativo; domínios genéricos são bloqueados.
            </div>
          </div>
          <div className="campo">
            <label htmlFor="whatsapp">
              WhatsApp <span style={{ color: "var(--faint)", fontWeight: 400 }}>(opcional)</span>
            </label>
            <input
              id="whatsapp"
              type="tel"
              placeholder="+55 11 9 0000-0000"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
            />
            <div className="dica">Convite só pessoal aceita email ou WhatsApp; um dos dois basta.</div>
          </div>
        </div>
      )}

      {passo === 1 && (
        <div className="painel" key="p1">
          <h3>Ingressos por dia</h3>
          <div className="parcelas">
            {tipos.map((t) => (
              <div className="parcela-linha" key={t.tipo}>
                <div className="dia">
                  {t.label}
                  <small>{t.data}</small>
                </div>
                <div className="pool-campo">
                  <span className="rotulo">
                    <b>Pessoal</b>
                    {t.pessoalDisp} disponíveis
                  </span>
                  <input
                    type="number"
                    min={0}
                    max={t.pessoalDisp}
                    value={qtd[t.tipo].pessoal}
                    disabled={t.pessoalDisp === 0}
                    onChange={(e) => setQuantidade(t.tipo, "pessoal", Number(e.target.value), t.pessoalDisp)}
                    aria-label={`Pessoal ${t.label}`}
                  />
                </div>
                <div className="pool-campo">
                  <span className="rotulo">
                    <b>Corporativo</b>
                    {podeCorporativo ? `restam ${t.corpDisp}` : "sem flag"}
                  </span>
                  <input
                    type="number"
                    min={0}
                    max={t.corpDisp}
                    value={qtd[t.tipo].corporativo}
                    disabled={!podeCorporativo || t.corpDisp === 0}
                    onChange={(e) => setQuantidade(t.tipo, "corporativo", Number(e.target.value), t.corpDisp)}
                    aria-label={`Corporativo ${t.label}`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {passo === 2 && (
        <div className="painel" key="p2">
          <h3>Revise antes de enviar</h3>
          <dl className="revisao">
            <div>
              <dt>Convidado</dt>
              <dd>{nome.trim() || "—"}</dd>
            </div>
            <div>
              <dt>Canais</dt>
              <dd>
                {[email.trim() && `email (${email.trim()})`, whatsapp.trim() && `WhatsApp (${whatsapp.trim()})`]
                  .filter(Boolean)
                  .join(" + ") || "—"}
              </dd>
            </div>
            <div>
              <dt>Ingressos</dt>
              <dd>
                {linhasResumo.length > 0 ? (
                  <ul className="resumo-lista">
                    {linhasResumo.map((l) => (
                      <li key={l.chave}>
                        {l.texto} <span className={`badge ${l.pool === "corporativo" ? "declarado" : "solido"}`}>{l.pool}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  "—"
                )}
              </dd>
            </div>
          </dl>

          {totalCorp > 0 && (
            <label className="vip-toggle">
              <input type="checkbox" checked={vip} onChange={(e) => setVip(e.target.checked)} />
              <span className="texto">
                VIP Omelete
                <small>Marca o convidado pro recorte VIP do evento. O admin pode editar depois.</small>
              </span>
            </label>
          )}

          {corpSemEmail && (
            <p className="alerta">A parcela corporativa exige email; volte ao passo 1 e preencha.</p>
          )}
        </div>
      )}

      <div className="rodape">
        <span className="nota">
          {passo === 2
            ? `${total} ingresso(s) · reserva atômica e envio chegam na F2`
            : passo === 1
              ? total > 0
                ? `${total} ingresso(s) selecionado(s)`
                : "Selecione pelo menos um ingresso"
              : "O convite sai por link mágico; os códigos nunca vão no corpo da mensagem"}
        </span>
        <div className="acoes">
          {passo > 0 && (
            <button className="cta fantasma" type="button" onClick={() => setPasso((p) => p - 1)}>
              Voltar
            </button>
          )}
          {passo < 2 ? (
            <button className="cta" type="button" disabled={!podeAvancar} onClick={() => setPasso((p) => p + 1)}>
              Continuar
            </button>
          ) : (
            <button className="cta" type="button" disabled title="O envio chega na F2">
              Enviar convite
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
