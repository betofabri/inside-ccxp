// Gera os PNGs dos cards de apoio (1080×1350, formato de story/feed) em
// public/cards/. Rodar após editar src/lib/cards-apoio.ts:
//   node scripts/gerar-cards.mjs
import { Resvg } from "@resvg/resvg-js";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";

// importa os dados sem compilar TS: extrai o array por regex do módulo
const fonte = readFileSync("src/lib/cards-apoio.ts", "utf8");
const cardsJson = fonte
  .match(/export const CARDS: Card\[\] = (\[[\s\S]*?\n\]);/)[1]
  // TS literal -> JSON: chaves sem aspas e aspas duplas já usadas nos valores
  .replace(/(\n\s*)(id|icone|titulo|linhas|rodape):/g, '$1"$2":')
  .replace(/,(\s*[}\]])/g, "$1");
const CARDS = JSON.parse(cardsJson);

const logo = readFileSync("public/ccxp-insider.svg", "utf8");
const logoInterno = logo.replace(/^<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "");

const esc = (t) =>
  t.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");

// quebra naive em ~46 chars respeitando palavras
function quebrar(texto, max = 46) {
  const palavras = texto.split(" ");
  const linhas = [];
  let atual = "";
  for (const p of palavras) {
    if ((atual + " " + p).trim().length > max) {
      linhas.push(atual.trim());
      atual = p;
    } else atual += " " + p;
  }
  if (atual.trim()) linhas.push(atual.trim());
  return linhas;
}

mkdirSync("public/cards", { recursive: true });

for (const card of CARDS) {
  const corpo = [];
  let y = 600;
  for (const linha of card.linhas) {
    const quebras = quebrar(linha);
    quebras.forEach((q, i) => {
      const marcador = i === 0 ? `<circle cx="92" cy="${y - 11}" r="5" fill="#E3C98E"/>` : "";
      corpo.push(
        `${marcador}<text x="120" y="${y}" font-family="Helvetica, Arial, sans-serif" font-size="34" fill="#C9C2B2">${esc(q)}</text>`,
      );
      y += 52;
    });
    y += 18;
  }
  const rodape = card.rodape
    ? quebrar(card.rodape, 52)
        .map(
          (q, i) =>
            `<text x="92" y="${1120 + i * 42}" font-family="Helvetica, Arial, sans-serif" font-size="29" font-style="italic" fill="#857E70">${esc(q)}</text>`,
        )
        .join("")
    : "";

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350">
  <defs>
    <radialGradient id="glow" cx="0.5" cy="0.25" r="0.9">
      <stop offset="0" stop-color="#241F18"/>
      <stop offset="0.55" stop-color="#171411"/>
      <stop offset="1" stop-color="#121110"/>
    </radialGradient>
    <linearGradient id="linha" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#FFD000"/>
      <stop offset="0.5" stop-color="#FF7A2F"/>
      <stop offset="1" stop-color="#ED3A86"/>
    </linearGradient>
  </defs>
  <rect width="1080" height="1350" fill="url(#glow)"/>
  <rect width="1080" height="10" fill="url(#linha)"/>
  <g transform="translate(92, 80) scale(0.20)">${logoInterno}</g>
  <text x="988" y="150" text-anchor="end" font-family="Helvetica, Arial, sans-serif" font-size="30" letter-spacing="5" fill="#857E70">CCXP26</text>
  <text x="92" y="420" font-family="Georgia, serif" font-size="76" fill="#EFEAE0">${esc(card.titulo)}</text>
  <rect x="92" y="465" width="120" height="5" fill="url(#linha)"/>
  ${corpo.join("\n  ")}
  ${rodape}
  <rect x="0" y="1245" width="1080" height="105" fill="#0D0C0B"/>
  <text x="92" y="1308" font-family="Helvetica, Arial, sans-serif" font-size="27" fill="#857E70">CCXP26 · 03 a 06/dez · São Paulo Expo</text>
  <text x="988" y="1308" text-anchor="end" font-family="Helvetica, Arial, sans-serif" font-size="27" fill="#E3C98E">CCXP INSIDER</text>
</svg>`;

  const png = new Resvg(svg, { fitTo: { mode: "width", value: 1080 } }).render().asPng();
  writeFileSync(`public/cards/${card.id}.png`, png);
  console.log(`cards/${card.id}.png — ${(png.length / 1024).toFixed(0)} KB`);
}
