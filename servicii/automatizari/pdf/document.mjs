// Transformă un document Markdown al clientului (propunere, pornire, folosire) în corpul HTML al PDF-ului.
// Reguli: primul „# ” = titlul; fiecare „## ” = o foaie (numerotată la pornire și folosire);
// ```schema``` = schema pașilor; „> **Atenție:**” = atenționare; ==cuvânt== = cuvântul-cheie în gradient.
import { Marked } from "marked";

export const TIPURI = ["propunere", "pornire", "folosire"];

const TIP_IN_CUVINTE = {
  propunere: "Propunere",
  pornire: "Instrucțiuni de pornire",
  folosire: "Instrucțiuni de folosire",
};

const marked = new Marked({ gfm: true });

const escapa = (t) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** ==cuvânt== → cuvântul-cheie, dar nu în cod. */
function cuvinteCheie(html) {
  return html
    .split(/(<pre[\s\S]*?<\/pre>|<code>[\s\S]*?<\/code>)/)
    .map((bucata, i) => (i % 2 ? bucata : bucata.replace(/==([^=\n]+?)==/g, '<em class="cheie">$1</em>')))
    .join("");
}

/** „> **Atenție:** …” → <aside class="atentie">. */
function atentionari(html) {
  return html.replace(
    /<blockquote>\s*<p><strong>Atenție:<\/strong>\s*([\s\S]*?)<\/blockquote>/g,
    '<aside class="atentie"><div class="k">Atenție</div><p>$1</aside>',
  );
}

/** Desparte corpul în textul de dinainte și foi, după rândurile „## ” din afara blocurilor de cod. */
function foi(md) {
  const inainte = [];
  const sectiuni = [];
  let inCod = false;
  for (const rand of md.split("\n")) {
    if (/^```/.test(rand)) inCod = !inCod;
    if (!inCod && /^## /.test(rand)) {
      sectiuni.push({ titlu: rand.slice(3).trim(), randuri: [] });
      continue;
    }
    (sectiuni.length ? sectiuni[sectiuni.length - 1].randuri : inainte).push(rand);
  }
  return { inainte: inainte.join("\n"), sectiuni };
}

export function documentInHtml(md, tip) {
  if (!TIPURI.includes(tip)) throw new Error(`Tip necunoscut „${tip}”. Tipurile: ${TIPURI.join(", ")}.`);
  const sedila = md.match(/[şţŞŢ]/);
  if (sedila) throw new Error(`Textul are sedilă („${sedila[0]}”): folosește ș și ț cu virgulă.`);

  md = md.replace(/\r\n/g, "\n");

  // blocurile schema se scot înainte de marked și se pun înapoi după
  const scheme = [];
  md = md.replace(/^```schema[ \t]*\n([\s\S]*?)^```[ \t]*$/gm, (_, continut) => {
    const pasi = continut.split("\n").map((p) => p.trim()).filter(Boolean);
    if (!pasi.length) throw new Error("Un bloc schema e gol: pune câte un pas pe rând.");
    scheme.push(`<ol class="schema">\n${pasi.map((p) => `<li>${escapa(p)}</li>`).join("\n")}\n</ol>`);
    return `SCHEMA${scheme.length - 1}SCHEMA`;
  });

  const potrivire = md.match(/^# (.+)$/m);
  if (!potrivire) throw new Error("Lipsește titlul: primul rând de forma „# Titlul documentului”.");
  const titlu = potrivire[1].trim();
  const corp = md.slice(0, potrivire.index) + md.slice(potrivire.index + potrivire[0].length);

  const randeaza = (text) => marked.parse(text);
  const { inainte, sectiuni } = foi(corp);

  let html = `<header class="cap">\n<h1>${marked.parseInline(titlu)}</h1>\n<p class="marca">buildwithac · ${TIP_IN_CUVINTE[tip]}</p>\n</header>\n`;
  html += randeaza(inainte);
  sectiuni.forEach((s, i) => {
    const pas = tip === "propunere" ? "" : `<div class="pas">pasul ${i + 1}</div>\n`;
    html += `<section class="foaie">\n${pas}<h2>${marked.parseInline(s.titlu)}</h2>\n${randeaza(s.randuri.join("\n"))}</section>\n`;
  });

  html = html.replace(/(?:<p>)?SCHEMA(\d+)SCHEMA(?:<\/p>)?/g, (_, n) => scheme[Number(n)]);
  return cuvinteCheie(atentionari(html));
}
