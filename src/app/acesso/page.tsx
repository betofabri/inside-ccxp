import { solicitarOtpAcesso, validarOtpAcesso } from "@/lib/otp";

export const dynamic = "force-dynamic";

// Login do convidado já cadastrado: email → OTP de 6 dígitos → carteira.
export default async function PaginaAcesso({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; erro?: string; demo?: string; falha?: string }>;
}) {
  const { email, erro, demo, falha } = await searchParams;

  return (
    <div className="pagina cadastro">
      <div className="cartao-convite">
        <h1>Acessar minha <em>carteira</em></h1>
        <p className="texto-convite">
          Digite o email do seu cadastro e enviaremos um código de 6 dígitos.
        </p>

        {erro === "nao_encontrado" && (
          <p className="alerta">Não achamos cadastro com esse email. Confira ou fale com seu anfitrião.</p>
        )}
        {falha === "limite" ? (
          <div className="aviso erro">Muitos códigos pedidos em sequência; espere uns 10 minutos.</div>
        ) : falha ? (
          <div className="aviso erro">O envio falhou; tente de novo.</div>
        ) : null}
        {demo && (
          <div className="aviso">
            <b>Modo demo</b> (envio de email ainda não configurado): seu código é{" "}
            <b className="mono">{demo}</b>.
          </div>
        )}
        {erro === "codigo" && <p className="alerta">Código incorreto ou vencido; peça outro.</p>}

        {!email ? (
          <form action={solicitarOtpAcesso} className="form-cadastro">
            <div className="campo">
              <label htmlFor="email">Email do cadastro</label>
              <input id="email" name="email" type="email" placeholder="nome@empresa.com" required autoFocus />
            </div>
            <button className="cta enviar-cadastro" type="submit">Receber código</button>
          </form>
        ) : (
          <div className="form-cadastro">
            <p className="texto-convite">
              Código enviado pra <b>{email}</b>.
            </p>
            <form action={validarOtpAcesso}>
              <input type="hidden" name="email" value={email} />
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
              <button className="cta enviar-cadastro" type="submit">Entrar</button>
            </form>
            <form action={solicitarOtpAcesso} style={{ marginTop: 10, textAlign: "center" }}>
              <input type="hidden" name="email" value={email} />
              <button className="acao" type="submit">Reenviar código</button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
