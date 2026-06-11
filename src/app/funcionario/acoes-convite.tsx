"use client";

import { useState } from "react";
import { cancelarConvite, reenviarConvite } from "@/lib/convites";

type Props = {
  conviteId: number;
  token: string;
  status: string;
};

export default function AcoesConvite({ conviteId, token, status }: Props) {
  const [copiado, setCopiado] = useState(false);

  const copiar = async () => {
    await navigator.clipboard.writeText(`${window.location.origin}/convite/${token}`);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  const ativo = status === "pendente" || status === "cadastrado";
  const reenviavel = status === "pendente" || status === "expirado";

  return (
    <div className="acoes-linha">
      {status === "pendente" && (
        <button className="acao" type="button" onClick={copiar}>
          {copiado ? "Copiado ✓" : "Copiar link"}
        </button>
      )}
      {reenviavel && (
        <form action={reenviarConvite}>
          <input type="hidden" name="conviteId" value={conviteId} />
          <button className="acao" type="submit" title="Regenera o link e renova o prazo">
            Reenviar
          </button>
        </form>
      )}
      {ativo && (
        <form action={cancelarConvite}>
          <input type="hidden" name="conviteId" value={conviteId} />
          <button className="acao perigo" type="submit" title="Devolve os códigos ao pool">
            Cancelar
          </button>
        </form>
      )}
      {!ativo && !reenviavel && <span className="dim">—</span>}
    </div>
  );
}
