import { db } from "@/lib/db";
import { assumirPersona } from "@/lib/actions";
import { NIVEL_LABEL } from "@/lib/labels";

export const dynamic = "force-dynamic";

// Entrada do admin — fora da navegação de propósito (P4: admin oculto).
// Só quem tem este link chega aqui; o hub não menciona.
export default async function PaginaBackstage() {
  const admins = await db.funcionario.findMany({
    where: { isAdmin: true, ativo: true },
    orderBy: { id: "asc" },
  });

  return (
    <div className="pagina cadastro">
      <div className="cartao-convite estado-convite">
        <span className="glifo-estado" aria-hidden>★</span>
        <span className="de-quem">CCXP INSIDER · acesso restrito</span>
        <h1>Backstage</h1>
        <p className="texto-convite">
          Entrada do admin — visão master do sistema. Esta página fica fora da navegação.
        </p>
        <ul className="lista-backstage">
          {admins.map((f) => (
            <li key={f.id}>
              <form action={assumirPersona}>
                <input type="hidden" name="role" value="admin" />
                <input type="hidden" name="id" value={f.id} />
                <button className="persona-btn" type="submit">
                  <span className="nome">{f.nome}</span>
                  <span className="meta">{NIVEL_LABEL[f.nivel]}</span>
                  <span className="seta">→</span>
                </button>
              </form>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
