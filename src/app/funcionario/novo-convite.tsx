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

type Fluxo = "pessoal" | "corporativo";

const PASSOS = ["Convidado", "Ingressos", "Revisão"];

const DDIS = [
  { codigo: "+55", pais: "BR" },
  { codigo: "+1", pais: "US/CA" },
  { codigo: "+52", pais: "MX" },
  { codigo: "+54", pais: "AR" },
  { codigo: "+44", pais: "UK" },
  { codigo: "+33", pais: "FR" },
  { codigo: "+34", pais: "ES" },
  { codigo: "+49", pais: "DE" },
  { codigo: "+351", pais: "PT" },
  { codigo: "+81", pais: "JP" },
  { codigo: "+82", pais: "KR" },
];

// hint visual; a validação real (lista editável pelo admin) chega na F2
const DOMINIOS_GENERICOS = [
  "gmail.com", "hotmail.com", "outlook.com", "yahoo.com", "icloud.com",
  "live.com", "msn.com", "aol.com", "proton.me", "protonmail.com",
  "gmx.com", "mail.com", "yandex.com",
];

export default function NovoConvite({ podeCorporativo, tipos }: Props) {
  const [fluxo, setFluxo] = useState<Fluxo>("pessoal");
  const [passo, setPasso] = useState(0);
  const [nome, setNome] = useState("");
  const [sobrenome, setSobrenome] = useState("");
  const [email, setEmail] = useState("");
  const [ddi, setDdi] = useState("+55");
  const [telefone, setTelefone] = useState("");
  const [vip, setVip] = useState(false);
  const [qtd, setQtd] = useState<Record<string, number>>(
    Object.fromEntries(tipos.map((t) => [t.tipo, 0])),
  );

  const trocarFluxo = (f: Fluxo) => {
    if (f === fluxo) return;
    setFluxo(f);
    setPasso(0);
    setVip(false);
    setQtd(Object.fromEntries(tipos.map((t) => [t.tipo, 0])));
  };

  const disp = (t: TipoInfo) => (fluxo === "pessoal" ? t.pessoalDisp : t.corpDisp);

  const setQuantidade = (tipo: string, valor: number, max: number) =>
    setQtd((q) => ({ ...q, [tipo]: Math.max(0, Math.min(max, valor)) }));

  const total = tipos.reduce((acc, t) => acc + qtd[t.tipo], 0);

  const nomeOk = nome.trim().length > 1 && sobrenome.trim().length > 1;
  const emailOk = email.trim().length > 3 && email.includes("@");
  const whatsOk = telefone.trim().length > 7;
  const dominio = email.trim().toLowerCase().split("@")[1] ?? "";
  const dominioGenerico = fluxo === "corporativo" && emailOk && DOMINIOS_GENERICOS.includes(dominio);

  const contatoOk =
    fluxo === "corporativo"
      ? nomeOk && emailOk && !dominioGenerico
      : nomeOk && (emailOk || whatsOk);

  const podeAvancar = passo === 0 ? contatoOk : passo === 1 ? total > 0 : false;

  const linhasResumo = tipos
    .filter((t) => qtd[t.tipo] > 0)
    .map((t) => ({ chave: t.tipo, texto: `${qtd[t.tipo]}× ${t.label}` }));

  return (
    <div className="composer wizard">
      <div className="fluxos" role="tablist" aria-label="Tipo de convite">
        <button
          type="button"
          role="tab"
          aria-selected={fluxo === "pessoal"}
          className={`fluxo-tab ${fluxo === "pessoal" ? "ativo" : ""}`}
          onClick={() => trocarFluxo("pessoal")}
        >
          Convite pessoal
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={fluxo === "corporativo"}
          className={`fluxo-tab ${fluxo === "corporativo" ? "ativo" : ""}`}
          onClick={() => trocarFluxo("corporativo")}
          disabled={!podeCorporativo}
          title={podeCorporativo ? undefined : "A flag corporativa é atribuída pelo admin"}
        >
          Convite corporativo
        </button>
        <span className="fluxo-dica">
          {fluxo === "pessoal"
            ? "Usa a sua cota da planilha; contato por email ou WhatsApp."
            : "Usa o lote compartilhado; email corporativo obrigatório."}
        </span>
      </div>

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
        <div className="painel" key={`p0-${fluxo}`}>
          <h3>Quem você vai convidar</h3>
          <div className="campo-dupla">
            <div className="campo">
              <label htmlFor="nome">Nome</label>
              <input
                id="nome"
                type="text"
                placeholder="Nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                autoFocus
              />
            </div>
            <div className="campo">
              <label htmlFor="sobrenome">Sobrenome</label>
              <input
                id="sobrenome"
                type="text"
                placeholder="Sobrenome"
                value={sobrenome}
                onChange={(e) => setSobrenome(e.target.value)}
              />
            </div>
          </div>
          <div className="campo">
            <label htmlFor="email">
              Email{" "}
              {fluxo === "pessoal" && (
                <span style={{ color: "var(--faint)", fontWeight: 400 }}>(ou WhatsApp)</span>
              )}
            </label>
            <input
              id="email"
              type="email"
              placeholder="nome@empresa.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {fluxo === "corporativo" && !dominioGenerico && (
              <div className="dica">Obrigatório no convite corporativo; domínios genéricos são bloqueados.</div>
            )}
            {dominioGenerico && (
              <div className="dica erro">
                {dominio} é um domínio genérico; o convite corporativo exige email da empresa.
              </div>
            )}
          </div>
          <div className="campo">
            <label htmlFor="telefone">
              WhatsApp <span style={{ color: "var(--faint)", fontWeight: 400 }}>(opcional)</span>
            </label>
            <div className="campo-telefone">
              <select
                aria-label="Código do país"
                value={ddi}
                onChange={(e) => setDdi(e.target.value)}
              >
                {DDIS.map((d) => (
                  <option key={d.codigo} value={d.codigo}>
                    {d.pais} {d.codigo}
                  </option>
                ))}
              </select>
              <input
                id="telefone"
                type="tel"
                placeholder="11 9 0000-0000"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
              />
            </div>
          </div>
        </div>
      )}

      {passo === 1 && (
        <div className="painel" key={`p1-${fluxo}`}>
          <h3>{fluxo === "pessoal" ? "Ingressos da sua cota" : "Ingressos do lote corporativo"}</h3>
          <div className="parcelas">
            {tipos.map((t) => {
              const max = disp(t);
              return (
                <div className={`parcela-linha t-${t.tipo}`} key={t.tipo}>
                  <div className="dia">
                    <span className="dot-tipo" aria-hidden />
                    {t.label}
                    <small>{t.data}</small>
                  </div>
                  <div className="pool-campo">
                    <span className="rotulo">
                      <b>{fluxo === "pessoal" ? "Disponíveis" : "Restam no lote"}</b>
                      {max}
                    </span>
                    <input
                      type="number"
                      min={0}
                      max={max}
                      value={qtd[t.tipo]}
                      disabled={max === 0}
                      onChange={(e) => setQuantidade(t.tipo, Number(e.target.value), max)}
                      aria-label={`${t.label}`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {passo === 2 && (
        <div className="painel" key={`p2-${fluxo}`}>
          <h3>Revise antes de enviar</h3>
          <dl className="revisao">
            <div>
              <dt>Convite</dt>
              <dd>
                <span className={`badge ${fluxo === "corporativo" ? "declarado" : "solido"}`}>{fluxo}</span>
              </dd>
            </div>
            <div>
              <dt>Convidado</dt>
              <dd>{`${nome.trim()} ${sobrenome.trim()}`.trim() || "—"}</dd>
            </div>
            <div>
              <dt>Canais</dt>
              <dd>
                {[
                  email.trim() && `email (${email.trim()})`,
                  telefone.trim() && `WhatsApp (${ddi} ${telefone.trim()})`,
                ]
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
                      <li key={l.chave}>{l.texto}</li>
                    ))}
                  </ul>
                ) : (
                  "—"
                )}
              </dd>
            </div>
          </dl>

          {fluxo === "corporativo" && (
            <label className="vip-toggle">
              <input type="checkbox" checked={vip} onChange={(e) => setVip(e.target.checked)} />
              <span className="texto">
                VIP Omelete
                <small>Marca o convidado pro recorte VIP do evento. O admin pode editar depois.</small>
              </span>
            </label>
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
