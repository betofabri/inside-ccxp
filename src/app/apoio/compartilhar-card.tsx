"use client";

import { useState } from "react";

// Compartilha o card COM a imagem anexada: no celular, navigator.share abre o
// share sheet com o PNG + legenda (WhatsApp anexa a imagem). Onde não dá
// (desktop), baixa o PNG e abre o wa.me com o texto pra colar junto.
type Props = {
  id: string;
  titulo: string;
  texto: string;
};

export default function CompartilharCard({ id, titulo, texto }: Props) {
  const [estado, setEstado] = useState<"pronto" | "enviando" | "baixado">("pronto");
  const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  const urlPng = `${base}/cards/${id}.png`;

  const compartilhar = async () => {
    setEstado("enviando");
    try {
      const resp = await fetch(urlPng);
      const blob = await resp.blob();
      const arquivo = new File([blob], `ccxp26-${id}.png`, { type: "image/png" });

      if (navigator.canShare?.({ files: [arquivo] })) {
        await navigator.share({ files: [arquivo], text: texto, title: `CCXP26 · ${titulo}` });
        setEstado("pronto");
        return;
      }
      // desktop: baixa a imagem e abre o WhatsApp Web com o texto
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `ccxp26-${id}.png`;
      a.click();
      URL.revokeObjectURL(a.href);
      window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, "_blank");
      setEstado("baixado");
      setTimeout(() => setEstado("pronto"), 4000);
    } catch {
      // share cancelado pelo usuário ou bloqueado: não é erro
      setEstado("pronto");
    }
  };

  return (
    <div className="card-acao">
      <button className="cta whats" type="button" onClick={compartilhar} disabled={estado === "enviando"}>
        {estado === "enviando" ? "Preparando…" : "Enviar no WhatsApp"}
      </button>
      {estado === "baixado" && (
        <span className="dica">Imagem baixada ✓ — anexe no WhatsApp junto com o texto.</span>
      )}
      <a
        className="acao"
        href={`https://wa.me/?text=${encodeURIComponent(texto)}`}
        target="_blank"
        rel="noreferrer"
        title="Sem a imagem, só a mensagem formatada"
      >
        só texto
      </a>
    </div>
  );
}
