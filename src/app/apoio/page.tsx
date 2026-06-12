import Image from "next/image";
import { CARDS, textoWhatsApp } from "@/lib/cards-apoio";
import CompartilharCard from "./compartilhar-card";

export const dynamic = "force-dynamic";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export default function PaginaApoio() {
  return (
    <div className="pagina">
      <h1>Assets</h1>
      <div className="sub">
        <span>
          Cards prontos pra encaminhar no WhatsApp pros seus convidados — vão com a imagem anexada e a
          legenda formatada.
        </span>
      </div>

      <div className="cards-apoio">
        {CARDS.map((c) => (
          <article className="card-apoio com-imagem" key={c.id}>
            <Image
              src={`${BASE}/cards/${c.id}.png`}
              alt={`Card ${c.titulo}: ${c.linhas.join("; ")}`}
              width={540}
              height={675}
              className="card-imagem"
              unoptimized
            />
            <CompartilharCard id={c.id} titulo={c.titulo} texto={textoWhatsApp(c)} />
          </article>
        ))}
      </div>
    </div>
  );
}
