import { redirect } from "next/navigation";
import { getPersona } from "@/lib/persona";
import { FOOTPRINT_ENABLED } from "@/lib/flags";
import AdminTabs from "../admin-tabs";

export const dynamic = "force-dynamic";

// Ficha do convidado + trajeto via bipagens (entry/exit/stage/purchase).
// Contrato de dados em src/lib/footprint.ts. Atrás de FOOTPRINT_ENABLED.
export default async function PaginaFootprint() {
  if (!FOOTPRINT_ENABLED) redirect("/admin");
  const persona = await getPersona();
  if (!persona || persona.role !== "admin") redirect("/");

  return (
    <div className="pagina">
      <h1>Footprint</h1>
      <div className="sub">
        <span>Ficha do convidado e trajeto no evento via bipagens da credencial.</span>
      </div>
      <AdminTabs ativa="footprint" />
      <div className="aviso">
        <b>Em construção.</b> A ficha agrega eventos de bipagem por credentialId: chegada/saída,
        palcos visitados e compras. Aguarda a fonte de dados do controle de acesso.
      </div>
    </div>
  );
}
