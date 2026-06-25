import { db } from "@/lib/db";
import { TIPO_LABEL } from "@/lib/labels";
import { completarCadastro, entrarNaCarteira, expirarVencidos } from "@/lib/convites";
import { solicitarOtpConvite, validarOtpConvite, verificado } from "@/lib/otp";
import { getT } from "@/lib/i18n";

export const dynamic = "force-dynamic";

const DDIS = ["+55", "+1", "+52", "+54", "+44", "+33", "+34", "+49", "+351", "+81", "+82"];

export default async function PaginaCadastro({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ erro?: string; otp?: string; demo?: string; falha?: string }>;
}) {
  const { token } = await params;
  const { erro, otp, demo, falha } = await searchParams;
  const { t, L } = await getT();
  const localeData = L === "pt" ? "pt-BR" : L === "es" ? "es-ES" : "en-US";
  const fmtDataL = (d: Date) =>
    d.toLocaleDateString(localeData, { day: "2-digit", month: "2-digit", year: "numeric" });

  await expirarVencidos();

  const convite = await db.convite.findUnique({
    where: { magicToken: token },
    include: { host: true, convidado: true, parcelas: true },
  });

  if (!convite) {
    return (
      <div className="pagina cadastro">
        <div className="cartao-convite estado-convite">
          <span className="glifo-estado" aria-hidden>?</span>
          <span className="de-quem">CCXP INSIDER · CCXP26</span>
          <h1>{t.convite.naoEncTitulo}</h1>
          <p className="texto-convite">{t.convite.naoEncTexto}</p>
          <div className="proximo-passo">
            <b>{t.convite.oQueFazer}</b> {t.convite.naoEncFazer}
          </div>
        </div>
      </div>
    );
  }

  const corporativo = convite.parcelas.some((p) => p.pool === "corporativo");
  const totalIngressos = convite.parcelas.reduce((acc, p) => acc + p.qtd, 0);
  const primeiroNome = convite.convidado.nome.split(" ")[0];

  if (convite.status === "cancelado" || convite.status === "expirado") {
    const expirado = convite.status === "expirado";
    return (
      <div className="pagina cadastro">
        <div className="cartao-convite estado-convite">
          <span className="glifo-estado" aria-hidden>{expirado ? "⌛" : "✕"}</span>
          <span className="de-quem">{t.convite.deQuem(convite.host.nome)}</span>
          <h1>{expirado ? t.convite.expTitulo : t.convite.canTitulo}</h1>
          <p className="texto-convite">
            {expirado
              ? t.convite.expTexto(primeiroNome, fmtDataL(convite.expiraEm), totalIngressos)
              : t.convite.canTexto}
          </p>
          <div className="proximo-passo">
            <b>{t.convite.voltaLabel}</b>{" "}
            {expirado ? t.convite.voltaExp(convite.host.nome) : t.convite.voltaCan(convite.host.nome)}
          </div>
          <p className="nota-estado">CCXP26 · {t.evento.datas} · {t.evento.local}</p>
        </div>
      </div>
    );
  }

  if (convite.status === "cadastrado") {
    return (
      <div className="pagina cadastro">
        <div className="cartao-convite">
          <h1>{t.convite.jaTitulo(primeiroNome)}</h1>
          <p className="texto-convite">{t.convite.jaTexto}</p>
          <form action={entrarNaCarteira} style={{ marginTop: 22 }}>
            <input type="hidden" name="convidadoId" value={convite.convidadoId} />
            <button className="cta" type="submit">{t.convite.jaBtn}</button>
          </form>
        </div>
      </div>
    );
  }

  // OTP: com email, o cadastro exige prova de posse (magic link descartado)
  const emailConvidado = convite.convidado.email;
  const otpOk = emailConvidado ? await verificado(token) : true;
  const mascarado = emailConvidado
    ? `${emailConvidado.slice(0, 2)}***@${emailConvidado.split("@")[1]}`
    : null;

  const cadastrar = completarCadastro.bind(null, token);
  const telefoneAtual = convite.convidado.telefone?.replace(/^\+\d\d?/, "") ?? "";

  return (
    <div className="pagina cadastro">
      <div className="cartao-convite">
        <span className="de-quem">{t.convite.deQuem(convite.host.nome)}</span>
        <h1>
          {t.convite.titulo(primeiroNome, totalIngressos)}<em>CCXP26</em>
        </h1>
        <p className="texto-convite">{t.evento.datas} · {t.evento.local}</p>

        <div className="resumo-ingressos">
          {convite.parcelas.map((p) => (
            <span className={`saldo-chip t-${p.tipo}`} key={p.id}>
              <span className="nome-tipo">{TIPO_LABEL[p.tipo]}</span>
              <span className="n c">{p.qtd}</span>
              {p.vip && <span className="badge vip">VIP</span>}
            </span>
          ))}
        </div>

        {!otpOk ? (
          <div className="form-cadastro otp-bloco">
            <h3>{t.convite.otpTitulo}</h3>
            <p className="texto-convite">{t.convite.otpSub(mascarado ?? "")}</p>
            {falha === "limite" && <div className="aviso erro">{t.convite.otpLimite}</div>}
            {falha && falha !== "limite" && <div className="aviso erro">{t.convite.otpFalha}</div>}
            {demo && (
              <div className="aviso">
                <b>{t.convite.otpDemo}</b> <b className="mono">{demo}</b>.
              </div>
            )}
            {erro === "codigo" && <p className="alerta">{t.convite.otpCodigoErrado}</p>}
            {otp !== "enviado" ? (
              <form action={solicitarOtpConvite}>
                <input type="hidden" name="token" value={token} />
                <button className="cta enviar-cadastro" type="submit">{t.convite.otpReceber}</button>
              </form>
            ) : (
              <>
                <form action={validarOtpConvite}>
                  <input type="hidden" name="token" value={token} />
                  <div className="campo">
                    <label htmlFor="codigo">{t.convite.otpLabelCodigo}</label>
                    <input
                      id="codigo"
                      name="codigo"
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      placeholder="000000"
                      className="campo-otp"
                      autoFocus
                      required
                    />
                  </div>
                  <button className="cta enviar-cadastro" type="submit">{t.convite.otpConfirmar}</button>
                </form>
                <form action={solicitarOtpConvite} style={{ marginTop: 10, textAlign: "center" }}>
                  <input type="hidden" name="token" value={token} />
                  <button className="acao" type="submit">{t.convite.otpReenviar}</button>
                </form>
              </>
            )}
          </div>
        ) : (
        <form action={cadastrar} className="form-cadastro">
          <h3>{t.convite.formTitulo}</h3>

          {erro === "campos" && <p className="alerta">{t.convite.erroCampos}</p>}
          {erro === "email_em_uso" && <p className="alerta">{t.convite.erroEmailUso}</p>}

          <div className="campo">
            <label htmlFor="nascimento">{t.convite.labelNasc}</label>
            <input id="nascimento" name="nascimento" type="date" required />
          </div>

          {corporativo && (
            <>
              <div className="campo">
                <label htmlFor="cargo">{t.convite.labelCargo}</label>
                <input id="cargo" name="cargo" type="text" placeholder={t.convite.phCargo} required />
              </div>
              <div className="campo">
                <label htmlFor="email">{t.convite.labelEmail}</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  defaultValue={convite.convidado.email ?? ""}
                  placeholder="nome@empresa.com"
                  required
                />
              </div>
              <div className="campo">
                <label htmlFor="celular">{t.convite.labelCelular}</label>
                <div className="campo-telefone">
                  <select name="ddi" aria-label="DDI" defaultValue="+55">
                    {DDIS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                  <input
                    id="celular"
                    name="celular"
                    type="tel"
                    defaultValue={telefoneAtual}
                    placeholder="11 9 0000-0000"
                    required
                  />
                </div>
              </div>
              <div className="campo-dupla">
                <div className="campo">
                  <label htmlFor="instagram">Instagram <span style={{ color: "var(--faint)", fontWeight: 400 }}>{t.convite.opcional}</span></label>
                  <input id="instagram" name="instagram" type="text" placeholder="@seuuser" />
                </div>
                <div className="campo">
                  <label htmlFor="linkedin">LinkedIn <span style={{ color: "var(--faint)", fontWeight: 400 }}>{t.convite.opcional}</span></label>
                  <input id="linkedin" name="linkedin" type="text" placeholder="linkedin.com/in/voce" />
                </div>
              </div>
            </>
          )}

          <label className="vip-toggle lgpd">
            <input type="checkbox" name="lgpd" required />
            <span className="texto">
              {t.convite.lgpdLabel}
              <small>
                {t.convite.lgpdSmall}{" "}
                <a href="#" style={{ textDecoration: "underline" }}>{t.convite.lgpdLink}</a>
              </small>
            </span>
          </label>

          <button className="cta enviar-cadastro" type="submit">{t.convite.concluir}</button>
          <p className="dica" style={{ textAlign: "center" }}>{t.convite.prazo(fmtDataL(convite.expiraEm))}</p>
        </form>
        )}
      </div>
    </div>
  );
}
