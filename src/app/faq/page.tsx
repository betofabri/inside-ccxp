import { getT } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function PaginaFaq() {
  const { t } = await getT();

  return (
    <div className="pagina">
      <h1>{t.faq.titulo}</h1>
      <div className="sub">
        <span>{t.faq.sub}</span>
      </div>

      <div className="faq-lista">
        {t.faq.itens.map((item, i) => (
          <details className="faq-item" key={i} open={i === 0}>
            <summary>
              <span className="faq-q">{item.q}</span>
              <span className="faq-mais" aria-hidden>+</span>
            </summary>
            <p className="faq-a">{item.a}</p>
          </details>
        ))}
      </div>

      <div className="faq-rodape">
        <b>{t.faq.aindaDuvida}</b> {t.faq.contato}
      </div>
    </div>
  );
}
