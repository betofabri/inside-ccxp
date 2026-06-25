import { trocarIdioma } from "@/lib/actions";
import { LOCALES, LOCALE_LABEL, type Locale } from "@/lib/i18n";

// Toggle PT / EN / ES no header. Server action grava o cookie e revalida —
// sem JS no cliente, funciona como um segmento de botões.
export default function LangToggle({ atual }: { atual: Locale }) {
  return (
    <div className="lang-toggle" role="group" aria-label="Idioma">
      {LOCALES.map((l) => (
        <form action={trocarIdioma} key={l}>
          <input type="hidden" name="lang" value={l} />
          <button
            type="submit"
            className={`lang-opt ${l === atual ? "ativo" : ""}`}
            aria-pressed={l === atual}
          >
            {LOCALE_LABEL[l]}
          </button>
        </form>
      ))}
    </div>
  );
}
