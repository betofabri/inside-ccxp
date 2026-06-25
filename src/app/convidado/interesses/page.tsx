import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getPersona } from "@/lib/persona";
import { salvarInteresses } from "@/lib/interesses";
import { getT } from "@/lib/i18n";
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
  const { t } = await getT();

  const convidado = await db.convidado.findUnique({ where: { id: persona.id } });
  if (!convidado) redirect("/");

  return (
    <div className="pagina cadastro">
      <div className="cartao-convite pesquisa-afinidade">
        <span className="de-quem">{t.pesquisa.ultima(convidado.nome.split(" ")[0])}</span>
        <h1>
          {t.pesquisa.tituloPre}
          <em>{t.pesquisa.tituloEm}</em>?
        </h1>
        <p className="texto-convite">{t.pesquisa.sub}</p>
        {erro === "vazio" && <div className="aviso erro">{t.pesquisa.erroVazio}</div>}
        <form action={salvarInteresses}>
          <input type="hidden" name="origem" value={origem ?? "cadastro"} />
          <ChipsInteresses
            opcoes={t.pesquisa.opcoes}
            rotuloVazio={t.pesquisa.escolhaUm}
            rotuloContinuar={t.pesquisa.continuar}
          />
        </form>
      </div>
    </div>
  );
}
