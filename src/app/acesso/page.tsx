import { solicitarOtpAcesso, validarOtpAcesso } from "@/lib/otp";
import { getT } from "@/lib/i18n";

export const dynamic = "force-dynamic";

// Login do convidado já cadastrado: email → OTP de 6 dígitos → carteira.
export default async function PaginaAcesso({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; erro?: string; demo?: string; falha?: string }>;
}) {
  const { email, erro, demo, falha } = await searchParams;
  const { t } = await getT();

  return (
    <div className="pagina cadastro">
      <div className="cartao-convite">
        <h1>
          {t.acesso.titulo}
          <em>{t.acesso.tituloEm}</em>
        </h1>
        <p className="texto-convite">{t.acesso.sub}</p>

        {erro === "nao_encontrado" && <p className="alerta">{t.acesso.naoEncontrado}</p>}
        {falha === "limite" ? (
          <div className="aviso erro">{t.acesso.limite}</div>
        ) : falha ? (
          <div className="aviso erro">{t.acesso.falhou}</div>
        ) : null}
        {demo && (
          <div className="aviso">
            <b>{t.acesso.demo}</b> <b className="mono">{demo}</b>.
          </div>
        )}
        {erro === "codigo" && <p className="alerta">{t.acesso.codigoErrado}</p>}

        {!email ? (
          <form action={solicitarOtpAcesso} className="form-cadastro">
            <div className="campo">
              <label htmlFor="email">{t.acesso.labelEmail}</label>
              <input id="email" name="email" type="email" placeholder="nome@empresa.com" required autoFocus />
            </div>
            <button className="cta enviar-cadastro" type="submit">{t.acesso.receber}</button>
          </form>
        ) : (
          <div className="form-cadastro">
            <p className="texto-convite">{t.acesso.enviadoPra(email)}</p>
            <form action={validarOtpAcesso}>
              <input type="hidden" name="email" value={email} />
              <div className="campo">
                <label htmlFor="codigo">{t.acesso.labelCodigo}</label>
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
              <button className="cta enviar-cadastro" type="submit">{t.acesso.entrar}</button>
            </form>
            <form action={solicitarOtpAcesso} style={{ marginTop: 10, textAlign: "center" }}>
              <input type="hidden" name="email" value={email} />
              <button className="acao" type="submit">{t.acesso.reenviar}</button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
