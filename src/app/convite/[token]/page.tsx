import { db } from "@/lib/db";
import { TIPO_LABEL, fmtData } from "@/lib/labels";
import { completarCadastro, entrarNaCarteira, expirarVencidos } from "@/lib/convites";

export const dynamic = "force-dynamic";

const DDIS = ["+55", "+1", "+52", "+54", "+44", "+33", "+34", "+49", "+351", "+81", "+82"];

export default async function PaginaCadastro({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ erro?: string }>;
}) {
  const { token } = await params;
  const { erro } = await searchParams;

  await expirarVencidos();

  const convite = await db.convite.findUnique({
    where: { magicToken: token },
    include: { host: true, convidado: true, parcelas: true },
  });

  if (!convite) {
    return (
      <div className="pagina cadastro">
        <div className="cartao-convite">
          <h1>Convite não encontrado</h1>
          <p className="texto-convite">
            Esse link não é válido. Confira a mensagem que você recebeu ou peça um novo link a quem
            convidou você.
          </p>
        </div>
      </div>
    );
  }

  const corporativo = convite.parcelas.some((p) => p.pool === "corporativo");
  const totalIngressos = convite.parcelas.reduce((acc, p) => acc + p.qtd, 0);
  const primeiroNome = convite.convidado.nome.split(" ")[0];

  if (convite.status === "cancelado" || convite.status === "expirado") {
    return (
      <div className="pagina cadastro">
        <div className="cartao-convite">
          <h1>{convite.status === "cancelado" ? "Convite cancelado" : "Convite expirado"}</h1>
          <p className="texto-convite">
            {convite.status === "cancelado"
              ? `Este convite foi cancelado por ${convite.host.nome}.`
              : `O prazo de cadastro venceu em ${fmtData(convite.expiraEm)} e os códigos voltaram ao pool. Peça a ${convite.host.nome} pra reenviar o convite.`}
          </p>
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
      </div>
    </div>
  );
}
