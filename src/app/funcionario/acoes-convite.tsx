"use client";

import { useState } from "react";
import { cancelarConvite, reenviarConvite, corrigirContatoConvite } from "@/lib/convites";

type Props = {
  conviteId: number;
  token: string;
  status: string;
};

export default function AcoesConvite({ conviteId, token, status }: Props) {
  const [copiado, setCopiado] = useState(false);

  const copiar = async () => {
    await navigator.clipboard.writeText(
      `${window.location.origin}${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/convite/${token}`,
    );
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
      {status === "pendente" && (
        <details className="corrigir-contato">
          <summary className="acao" title="Email errado trava o convidado no código de verificação">
            Corrigir contato
          </summary>
          <form action={corrigirContatoConvite} className="form-contato">
            <input type="hidden" name="conviteId" value={conviteId} />
            <input type="email" name="email" placeholder="email certo" />
            <input type="tel" name="telefone" placeholder="whatsapp (opcional)" />
            <button className="acao" type="submit">Salvar</button>
          </form>
        </details>
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
