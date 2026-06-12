import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getPersona } from "@/lib/persona";
import { INTERESSES_OPCOES } from "@/lib/labels";
import { salvarInteresses } from "@/lib/interesses";
import ChipsInteresses from "./chips";

export const dynamic = "force-dynamic";

export default async function PaginaInteresses({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string; origem?: string }>;
}) {
  const persona = await getPersona();
  if (!persona || persona.role !== "convidado") redirect("/");
  const { erro, origem } = await searchParams;

  const convidado = await db.convidado.findUnique({ where: { id: persona.id } });
  if (!convidado) redirect("/");

  return (
    <div className="pagina cadastro">
      <div className="cartao-convite pesquisa-afinidade">
        <span className="de-quem">Última coisa, {convidado.nome.split(" ")[0]} · leva 10 segundos</span>
        <h1>
          O que te atrai na <em>CCXP</em>?
        </h1>
        <p className="texto-convite">
          Toque em tudo que combina com você. Usamos isso pra deixar sua experiência (e nossos
          convites) mais com a sua cara.
        </p>
        {erro === "vazio" && <div className="aviso erro">Escolha pelo menos um interesse.</div>}
        <form action={salvarInteresses}>
          <input type="hidden" name="origem" value={origem ?? "cadastro"} />
          <ChipsInteresses opcoes={INTERESSES_OPCOES} />
        </form>
      </div>
    </div>
  );
}
