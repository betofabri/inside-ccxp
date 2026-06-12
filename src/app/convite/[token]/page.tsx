import { db } from "@/lib/db";
import { TIPO_LABEL, fmtData } from "@/lib/labels";
import { completarCadastro, entrarNaCarteira, expirarVencidos } from "@/lib/convites";
import { solicitarOtpConvite, validarOtpConvite, verificado } from "@/lib/otp";

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
          <h1>Convite não encontrado</h1>
          <p className="texto-convite">
            Esse link não é válido — pode ter sido digitado errado ou substituído por um mais novo.
          </p>
          <div className="proximo-passo">
            <b>O que fazer:</b> confira a mensagem que você recebeu (o link certo é o mais recente) ou
            peça um novo link a quem convidou você.
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
          <span className="de-quem">
            Convite de <b>{convite.host.nome}</b> · Omelete Company
          </span>
          <h1>{expirado ? "Esse convite venceu" : "Convite cancelado"}</h1>
          <p className="texto-convite">
            {expirado ? (
              <>
                {primeiroNome}, o prazo de cadastro terminou em <b>{fmtData(convite.expiraEm)}</b> e os{" "}
                {totalIngressos} ingresso(s) reservados voltaram pro pool da CCXP26.
              </>
            ) : (
              <>Este convite pra CCXP26 foi cancelado por quem convidou você.</>
            )}
          </p>
          <div className="proximo-passo">
            <b>Mas calma — isso tem volta:</b> fale com <b>{convite.host.nome}</b> e peça pra{" "}
            {expirado ? "reenviar o convite" : "enviar um novo convite"}. Leva um clique do lado de lá
            e você recebe um link novo{expirado ? " com prazo renovado" : ""}.
          </div>
          <p className="nota-estado">CCXP26 · 03 a 06 de dezembro de 2026 · São Paulo Expo</p>
        </div>
      </div>
    );
  }

  if (convite.status === "cadastrado") {
    return (
      <div className="pagina cadastro">
        <div className="cartao-convite">
          <h1>Você já está na lista, {primeiroNome}</h1>
          <p className="texto-convite">Seu cadastro foi concluído e os códigos estão na sua carteira.</p>
          <form action={entrarNaCarteira} style={{ marginTop: 22 }}>
            <input type="hidden" name="convidadoId" value={convite.convidadoId} />
            <button className="cta" type="submit">Abrir minha carteira</button>
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
        <span className="de-quem">
          Convite de <b>{convite.host.nome}</b> · Omelete Company
        </span>
        <h1>
          {primeiroNome}, você tem {totalIngressos} ingresso(s) pra <em>CCXP26</em>
        </h1>
        <p className="texto-convite">03 a 06 de dezembro de 2026 · São Paulo Expo</p>

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
            <h3>Confirme que é você</h3>
            <p className="texto-convite">
              Por segurança, enviamos um código de 6 dígitos pra <b>{mascarado}</b>.
            </p>
            {falha && (
              <div className="aviso erro">O envio falhou; tente reenviar o código.</div>
            )}
            {demo && (
              <div className="aviso">
                <b>Modo demo</b> (envio de email ainda não configurado): seu código é{" "}
                <b className="mono">{demo}</b>.
              </div>
            )}
            {erro === "codigo" && <p className="alerta">Código incorreto ou vencido; tente de novo.</p>}
            {otp !== "enviado" ? (
              <form action={solicitarOtpConvite}>
                <input type="hidden" name="token" value={token} />
                <button className="cta enviar-cadastro" type="submit">Receber código por email</button>
              </form>
            ) : (
              <>
                <form action={validarOtpConvite}>
                  <input type="hidden" name="token" value={token} />
                  <div className="campo">
                    <label htmlFor="codigo">Código de 6 dígitos</label>
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
                  <button className="cta enviar-cadastro" type="submit">Confirmar código</button>
                </form>
                <form action={solicitarOtpConvite} style={{ marginTop: 10, textAlign: "center" }}>
                  <input type="hidden" name="token" value={token} />
                  <button className="acao" type="submit">Reenviar código</button>
                </form>
              </>
            )}
          </div>
        ) : (
        <form action={cadastrar} className="form-cadastro">
          <h3>Complete seu cadastro pra receber os códigos</h3>

          {erro === "campos" && <p className="alerta">Preencha todos os campos obrigatórios.</p>}
          {erro === "email_em_uso" && (
            <p className="alerta">Esse email já está em uso em outra conta; confira o endereço.</p>
          )}

          <div className="campo">
            <label htmlFor="nascimento">Data de nascimento</label>
            <input id="nascimento" name="nascimento" type="date" required />
          </div>

          {corporativo && (
            <>
              <div className="campo">
                <label htmlFor="cargo">Cargo</label>
                <input id="cargo" name="cargo" type="text" placeholder="Seu cargo na empresa" required />
              </div>
              <div className="campo">
                <label htmlFor="email">Email</label>
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
                <label htmlFor="celular">Celular</label>
                <div className="campo-telefone">
                  <select name="ddi" aria-label="Código do país" defaultValue="+55">
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
                  <label htmlFor="instagram">Instagram <span style={{ color: "var(--faint)", fontWeight: 400 }}>(opcional)</span></label>
                  <input id="instagram" name="instagram" type="text" placeholder="@seuuser" />
                </div>
                <div className="campo">
                  <label htmlFor="linkedin">LinkedIn <span style={{ color: "var(--faint)", fontWeight: 400 }}>(opcional)</span></label>
                  <input id="linkedin" name="linkedin" type="text" placeholder="linkedin.com/in/voce" />
                </div>
              </div>
            </>
          )}

          <label className="vip-toggle lgpd">
            <input type="checkbox" name="lgpd" required />
            <span className="texto">
              Li e aceito a política de privacidade
              <small>
                Seus dados são usados só pra entrega dos ingressos e comunicação do evento (LGPD).{" "}
                <a href="#" style={{ textDecoration: "underline" }}>Política de privacidade</a>
              </small>
            </span>
          </label>

          <button className="cta enviar-cadastro" type="submit">
            Concluir cadastro e ver meus códigos
          </button>
          <p className="dica" style={{ textAlign: "center" }}>
            Cadastro até {fmtData(convite.expiraEm)}; depois disso o convite expira.
          </p>
        </form>
        )}
      </div>
    </div>
  );
}
