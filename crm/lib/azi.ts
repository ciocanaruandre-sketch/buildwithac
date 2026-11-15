import { cand, termenScurt } from "@/lib/afisare";
import { dePlatitOm, textZile, type ComisionOm, type Transa } from "@/lib/finante";
import { textIntarziere } from "@/lib/proiecte";
import { normalizeazaTelefon } from "@/lib/telefon";
import { FUS, laOraRomaniei, ziuaPeste, ziuaRomaniei } from "@/lib/timp";
import { ETICHETE, type Rol, type Serviciu, type Stadiu, type Stare, type Sursa } from "@/lib/tipuri";

export type Tema = "sunat" | "discutii" | "lucru" | "bani";
export type TipRand = "lead_nou" | "callback" | "discutie" | "task" | "termen" | "cerere" | "livrare_refacut" | "livrare_fara_raspuns" | "rata" | "comision" | "vanzare";
export type Urgenta = "intarziat" | "azi" | "urmeaza" | "cand_ai_timp";

/** Un rând din pagina „Azi”. Doar date simple: trece de la server la componenta client. */
export type RandAzi = {
  /** `${tip}:${id}`, unic pe pagină */
  cheie: string;
  tip: TipRand;
  tema: Tema;
  urgenta: Urgenta;
  /** ms: de când întârzie (întârziate), ora (azi, cu oră), ziua (urmează); null = fără oră */
  la: number | null;
  /** discuție care începe în cel mult 15 minute (sau a început de cel mult 15) */
  curand: boolean;
  nume: string;
  /** numele unui lead sau client: trece prin <Ascuns> */
  numeAscuns: boolean;
  /** numele clientului, prima bucată din descriere, prin <Ascuns> */
  client: string | null;
  descriere: string[];
  suma: number | null;
  cand: string;
  href: string;
  telefonNorm: string | null;
  lead?: { id: string; stare: Stare; caller_id: string | null; closer_id: string | null };
  taskId?: string;
  transa?: { id: string; suma: number };
  comision?: { omId: string; poatePlati: boolean };
};

/** Ce citește pagina din bază, pentru omul conectat (lib/azi-date.ts). */
export type DateAzi = {
  leaduri: { id: string; nume: string; telefon_norm: string | null; serviciu: Serviciu; sursa: Sursa; stare: Stare; intrat_la: string; callback_la: string | null; caller_id: string | null; closer_id: string | null }[];
  discutii: { id: string; lead_id: string; closer_id: string; incepe_la: string; lead: { nume: string; telefon_norm: string | null; serviciu: Serviciu } }[];
  taskuri: { id: string; titlu: string; om_id: string | null; termen: string | null; proiect_id: string; proiect: string; client_id: string; client: string }[];
  proiecte: { id: string; titlu: string; client_id: string; client: string; telefon: string | null; serviciu: Serviciu; stadiu: Stadiu; termen: string | null; inchis_la: string | null; creat_la: string }[];
  oameniProiect: { proiect_id: string; om_id: string }[];
  /** evenimente_proiect cu tip = 'stadiu' */
  /** `de`: stadiul din care s-a mutat (lipsește la evenimentele vechi, fără el). */
  stadii: { proiect_id: string; la: string; in: Stadiu; de?: Stadiu }[];
  cereri: { lead_id: string; primita_la: string }[];
  clienti: { id: string; nume: string; lead_id: string | null }[];
  livrari: { id: string; titlu: string; stare: "trimis" | "aprobat" | "de_refacut"; adaugat_la: string; proiect_id: string }[];
  transe: (Transa & { client_id: string; client: string; telefon: string | null })[];
  comisioane: { om_id: string; nume: string; randuri: ComisionOm[] }[];
  oameni: { id: string; nume: string }[];
};

export const TEME_ROL: Record<Rol, Tema[]> = {
  admin: ["sunat", "discutii", "lucru", "bani"],
  caller: ["sunat"],
  closer: ["sunat", "discutii"],
  constructor: ["lucru"],
};

export const ETICHETA_TIP: Record<TipRand, string> = {
  lead_nou: "Lead nou",
  callback: "Callback",
  discutie: "Discuție",
  task: "Task",
  termen: "Termen",
  cerere: "Cerere nouă",
  livrare_refacut: "Livrare",
  livrare_fara_raspuns: "Livrare",
  rata: "Rată",
  comision: "Comision",
  vanzare: "Vânzare",
};

const MIN = 60_000;
const ORA = 60 * MIN;
const ZI = 24 * ORA;
/** Stadiile în care proiectul încă se lucrează (termenul de predare contează). */
const IN_LUCRU: Stadiu[] = ["discutie", "schita", "constructie", "revizii"];
const LIVRAT: Record<Serviciu, string> = { site: "Site livrat", automatizari: "Automatizare livrată", "1la1": "Sesiune ținută", altceva: "Proiect livrat" };
const PROPUNERE: Record<Serviciu, string> = { site: "propune o automatizare", automatizari: "propune un site", "1la1": "propune ceva nou", altceva: "propune ceva nou" };

/** Zile întregi de la `a` la `b` (YYYY-MM-DD). */
const zileIntre = (a: string, b: string) => (Date.UTC(...parti(b)) - Date.UTC(...parti(a))) / ZI;
const parti = (zi: string): [number, number, number] => {
  const [a, l, z] = zi.split("-").map(Number);
  return [a, l - 1, z];
};
const ziDupa = (zi: string, n: number) => {
  const [a, l, z] = parti(zi);
  return new Date(Date.UTC(a, l, z + n)).toISOString().slice(0, 10);
};
/** Începutul zilei (ora României), în ms. */
const inceput = (zi: string) => laOraRomaniei(zi, "00:00").getTime();
const ms = (t: string) => new Date(t).getTime();
const prenume = (nume: string) => nume.split(/\s+/)[0];

/** „intrat acum 25 min”, „intrat acum o oră”, „intrat acum 3 ore”, apoi „intrat ieri, 18:40”. */
export function textIntrat(intrat: string, acum: Date): string {
  const d = acum.getTime() - ms(intrat);
  if (d < ORA) return `intrat acum ${Math.max(1, Math.floor(d / MIN))} min`;
  if (d < 6 * ORA) {
    const h = Math.floor(d / ORA);
    return `intrat acum ${h === 1 ? "o oră" : `${h} ore`}`;
  }
  return `intrat ${cand(intrat, acum)}`;
}

/** Urgența și `la` pentru un rând cu o zi (termen, scadență): întârziat din ziua de după. */
function dupaZi(zi: string, azi: string): { urgenta: Urgenta; la: number | null } {
  if (zi < azi) return { urgenta: "intarziat", la: inceput(ziDupa(zi, 1)) };
  if (zi === azi) return { urgenta: "azi", la: null };
  return { urgenta: "urmeaza", la: inceput(zi) };
}
/** „azi”, „mâine” sau „23 nov.”, pentru o zi care n-a trecut. */
const ziViitoare = (zi: string, azi: string) => (zi === azi ? "azi" : zi === ziDupa(azi, 1) ? "mâine" : termenScurt(zi));

const gol = { curand: false, client: null, suma: null, telefonNorm: null } as const;

/** Tot ce are omul de făcut, după regulile din spec (§4, §6). Neordonate: ordinea e în `ordoneaza`. */
export function randuriAzi(d: DateAzi, om: { id: string; rol: Rol }, acum: Date): RandAzi[] {
  const teme = TEME_ROL[om.rol];
  const admin = om.rol === "admin";
  const azi = ziuaRomaniei(acum);
  const pana7 = ziuaPeste(acum, 7);
  const t = acum.getTime();
  const numeOm = new Map(d.oameni.map((o) => [o.id, o.nume]));
  const proiect = new Map(d.proiecte.map((p) => [p.id, p]));
  const peProiect = (proiectId: string) => admin || d.oameniProiect.some((x) => x.proiect_id === proiectId && x.om_id === om.id);
  const r: RandAzi[] = [];

  if (teme.includes("sunat")) {
    const sfarsitAzi = inceput(ziuaPeste(acum, 1));
    for (const l of d.leaduri) {
      const alMeu = l.caller_id === om.id || l.closer_id === om.id;
      const baza = {
        ...gol,
        tema: "sunat" as const,
        nume: l.nume,
        numeAscuns: true,
        descriere: [ETICHETE.serviciu[l.serviciu], ETICHETE.sursa[l.sursa]],
        href: `/lead-uri/${l.id}`,
        telefonNorm: l.telefon_norm,
        lead: { id: l.id, stare: l.stare, caller_id: l.caller_id, closer_id: l.closer_id },
      };
      if (l.stare === "nou" && (admin || alMeu || l.caller_id === null)) {
        const intarziat = t - ms(l.intrat_la) >= ZI;
        r.push({ ...baza, cheie: `lead_nou:${l.id}`, tip: "lead_nou", urgenta: intarziat ? "intarziat" : "azi", la: intarziat ? ms(l.intrat_la) + ZI : ms(l.intrat_la), cand: textIntrat(l.intrat_la, acum) });
      }
      if (l.stare === "callback" && l.callback_la && ms(l.callback_la) < sfarsitAzi && (admin || alMeu)) {
        const intarziat = ms(l.callback_la) < t;
        r.push({ ...baza, cheie: `callback:${l.id}`, tip: "callback", urgenta: intarziat ? "intarziat" : "azi", la: ms(l.callback_la), cand: `${intarziat ? "trebuia " : ""}${cand(l.callback_la, acum)}` });
      }
    }
  }

  if (teme.includes("discutii")) {
    const maine = ziuaPeste(acum, 1);
    for (const x of d.discutii) {
      const incepe = ms(x.incepe_la);
      const zi = ziuaRomaniei(new Date(incepe));
      if (incepe < t - 15 * MIN || (zi !== azi && zi !== maine)) continue;
      if (!admin && x.closer_id !== om.id) continue;
      const cine = x.closer_id === om.id ? "cu tine" : `cu ${prenume(numeOm.get(x.closer_id) ?? "altcineva")}`;
      r.push({
        ...gol,
        cheie: `discutie:${x.id}`,
        tip: "discutie",
        tema: "discutii",
        urgenta: zi === azi ? "azi" : "urmeaza",
        la: incepe,
        curand: incepe <= t + 15 * MIN,
        nume: x.lead.nume,
        numeAscuns: true,
        descriere: [ETICHETE.serviciu[x.lead.serviciu], ...(admin ? [cine] : [])],
        cand: cand(x.incepe_la, acum),
        href: `/lead-uri/${x.lead_id}`,
        telefonNorm: x.lead.telefon_norm,
      });
    }
  }

  if (teme.includes("lucru")) {
    for (const k of d.taskuri) {
      if (!k.termen || k.termen > pana7) continue;
      if (!admin && k.om_id !== om.id) continue;
      const cine = k.om_id === null ? "neatribuit" : k.om_id === om.id ? "tu" : prenume(numeOm.get(k.om_id) ?? "altcineva");
      r.push({
        ...gol,
        ...dupaZi(k.termen, azi),
        cheie: `task:${k.id}`,
        tip: "task",
        tema: "lucru",
        nume: k.titlu,
        numeAscuns: false,
        client: k.client,
        descriere: [k.proiect, ...(admin ? [cine] : [])],
        cand: k.termen < azi ? textIntarziere(zileIntre(k.termen, azi)) : ziViitoare(k.termen, azi),
        href: `/clienti/${k.client_id}?proiect=${k.proiect_id}`,
        taskId: k.id,
      });
    }

    for (const p of d.proiecte) {
      if (p.inchis_la || !IN_LUCRU.includes(p.stadiu) || !p.termen || p.termen > pana7 || !peProiect(p.id)) continue;
      const z = zileIntre(azi, p.termen);
      r.push({
        ...gol,
        ...dupaZi(p.termen, azi),
        cheie: `termen:${p.id}`,
        tip: "termen",
        tema: "lucru",
        nume: p.client,
        numeAscuns: true,
        descriere: [p.titlu, ETICHETE.stadiu[p.stadiu]],
        cand: z < 0 ? `predare depășită cu ${textZile(-z)}` : z === 0 ? "predare azi" : z === 1 ? "predare mâine" : `predare peste ${textZile(z)}`,
        href: `/clienti/${p.client_id}?proiect=${p.id}`,
      });
    }

    if (admin) {
      for (const c of d.clienti) {
        if (!c.lead_id) continue;
        const ultima = d.cereri.filter((x) => x.lead_id === c.lead_id).reduce((m, x) => (ms(x.primita_la) > m ? ms(x.primita_la) : m), 0);
        const celMaiNou = d.proiecte.filter((p) => p.client_id === c.id).reduce((m, p) => Math.max(m, ms(p.creat_la)), 0);
        if (!ultima || !celMaiNou || ultima <= celMaiNou) continue;
        r.push({ ...gol, cheie: `cerere:${c.id}`, tip: "cerere", tema: "lucru", urgenta: "azi", la: null, nume: c.nume, numeAscuns: true, descriere: ["a trimis iar formularul"], cand: cand(new Date(ultima), acum), href: `/clienti/${c.id}` });
      }
    }

    for (const v of d.livrari) {
      const p = proiect.get(v.proiect_id);
      if (!p || p.inchis_la) continue;
      const baza = { ...gol, tema: "lucru" as const, nume: p.client, numeAscuns: true, href: `/clienti/${p.client_id}?proiect=${p.id}`, telefonNorm: p.telefon ? normalizeazaTelefon(p.telefon) : null };
      if (v.stare === "de_refacut" && peProiect(p.id)) {
        r.push({ ...baza, cheie: `livrare_refacut:${v.id}`, tip: "livrare_refacut", urgenta: "azi", la: null, descriere: [v.titlu, p.titlu], cand: "de refăcut" });
      }
      const zile = Math.floor((t - ms(v.adaugat_la)) / ZI);
      if (admin && v.stare === "trimis" && zile >= 5) {
        r.push({ ...baza, cheie: `livrare_fara_raspuns:${v.id}`, tip: "livrare_fara_raspuns", urgenta: "urmeaza", la: ms(v.adaugat_la), descriere: [v.titlu], cand: `trimis acum ${textZile(zile)}` });
      }
    }
  }

  if (teme.includes("bani")) {
    for (const x of d.transe) {
      if (x.incasata_la || x.tip === "inainte" || x.scadenta > pana7) continue;
      r.push({
        ...gol,
        ...dupaZi(x.scadenta, azi),
        cheie: `rata:${x.id}`,
        tip: "rata",
        tema: "bani",
        nume: x.client,
        numeAscuns: true,
        descriere: [x.eticheta],
        suma: x.suma_lei,
        cand: x.scadenta < azi ? `întârzie ${textZile(zileIntre(x.scadenta, azi))}` : ziViitoare(x.scadenta, azi),
        href: `/clienti/${x.client_id}?proiect=${x.proiect_id}`,
        telefonNorm: x.telefon ? normalizeazaTelefon(x.telefon) : null,
        transa: { id: x.id, suma: x.suma_lei },
      });
    }

    for (const c of d.comisioane) {
      if (!c.randuri.some((x) => !x.platit_la)) continue;
      const p = dePlatitOm(c.randuri);
      r.push({
        ...gol,
        cheie: `comision:${c.om_id}`,
        tip: "comision",
        tema: "bani",
        urgenta: "cand_ai_timp",
        la: null,
        nume: c.nume,
        numeAscuns: false,
        descriere: ["comisioane neplătite", ...(p.nestabilite ? [`${p.nestabilite} fără sumă încă`] : [])],
        suma: p.total,
        cand: "când ai timp",
        href: "/finante",
        comision: { omId: c.om_id, poatePlati: p.poatePlati },
      });
    }

    // a doua vânzare: un rând pe client, după cea mai nouă livrare.
    // Ziua livrării = prima intrare în Livrat/Mentenanță din șirul neîntrerupt de acum: Livrat → Mentenanță nu repornește numărătoarea.
    const LIVRARE: Stadiu[] = ["livrat", "mentenanta"];
    const ziuaLivrarii = (p: DateAzi["proiecte"][number]) => {
      let start: number | null = null;
      for (const s of d.stadii.filter((x) => x.proiect_id === p.id).sort((a, b) => ms(a.la) - ms(b.la))) {
        if (!LIVRARE.includes(s.in)) start = null;
        // venit din Livrat/Mentenanță: livrarea e înainte de fereastra citită (62 de zile), deci prea veche
        else if (start === null) start = s.de && LIVRARE.includes(s.de) ? -Infinity : ms(s.la);
      }
      return start ?? ms(p.creat_la);
    };
    const vanzari = new Map<string, { p: DateAzi["proiecte"][number]; livratLa: number }>();
    for (const p of d.proiecte) {
      if (p.stadiu !== "livrat" && p.stadiu !== "mentenanta") continue;
      const livratLa = ziuaLivrarii(p);
      const zile = (t - livratLa) / ZI;
      if (zile < 30 || zile >= 61) continue;
      if (d.proiecte.some((x) => x.client_id === p.client_id && ms(x.creat_la) > livratLa)) continue;
      const deja = vanzari.get(p.client_id);
      if (!deja || livratLa > deja.livratLa) vanzari.set(p.client_id, { p, livratLa });
    }
    for (const { p, livratLa } of [...vanzari.values()].sort((a, b) => a.livratLa - b.livratLa)) {
      const saptamani = Math.floor((t - livratLa) / (7 * ZI));
      r.push({
        ...gol,
        cheie: `vanzare:${p.client_id}`,
        tip: "vanzare",
        tema: "bani",
        urgenta: "cand_ai_timp",
        la: livratLa,
        nume: p.client,
        numeAscuns: true,
        descriere: [`${LIVRAT[p.serviciu]} acum ${saptamani} săptămâni`, PROPUNERE[p.serviciu]],
        cand: "când ai timp",
        href: `/clienti/${p.client_id}`,
        telefonNorm: p.telefon ? normalizeazaTelefon(p.telefon) : null,
      });
    }
  }

  return r;
}

// ---------------------------------------------------------------------------------------------
// Ordinea, „Acum”, plăcile, cifrele de sus

const GRUPA: Record<Urgenta, number> = { intarziat: 1, azi: 2, urmeaza: 3, cand_ai_timp: 4 };
const grupa = (x: RandAzi) => (x.curand ? 0 : GRUPA[x.urgenta]);

/** Ordinea din spec §5. „Acum” = primul rând. */
export function ordoneaza(r: RandAzi[]): RandAzi[] {
  return [...r].sort((a, b) => {
    const g = grupa(a) - grupa(b);
    if (g) return g;
    switch (grupa(a)) {
      case 1:
        return (a.la ?? 0) - (b.la ?? 0) || Number(b.tip === "lead_nou") - Number(a.tip === "lead_nou");
      case 4: {
        const c = Number(b.tip === "comision") - Number(a.tip === "comision");
        if (c) return c;
        return a.tip === "comision" ? a.nume.localeCompare(b.nume, "ro") : (a.la ?? 0) - (b.la ?? 0);
      }
      default:
        // fără oră la urmă
        return (a.la ?? Infinity) - (b.la ?? Infinity) || 0;
    }
  });
}

/** „Mai târziu”: cheia rândului de după cel din „Acum” (după ultimul, primul). null dacă n-are unde trece. */
export function urmatorul(r: RandAzi[], cheie: string | null): string | null {
  if (r.length < 2) return null;
  const i = Math.max(0, r.findIndex((x) => x.cheie === cheie));
  return r[(i + 1) % r.length].cheie;
}

/** „1 task”, „3 task-uri”, „20 de task-uri” (de la 20 în sus, „de”, ca la textZile). */
function cate(n: number, unu: string, multe: string): string {
  if (n === 1) return `1 ${unu}`;
  const rest = n % 100;
  return `${n}${rest === 0 || rest >= 20 ? " de" : ""} ${multe}`;
}

export type Placa = { tema: Tema; nume: string; total: number; intarziate: number; rezumat: string };
const NUME_TEMA: Record<Tema, string> = { sunat: "De sunat", discutii: "Discuții", lucru: "Lucru", bani: "Bani" };
const ORDINE_TEME: Tema[] = ["sunat", "discutii", "lucru", "bani"];

function rezumat(tema: Tema, r: RandAzi[]): string {
  const nr = (f: (x: RandAzi) => boolean) => r.filter(f).length;
  const parti = (p: [number, string, string][]) =>
    p
      .filter(([k]) => k > 0)
      .map(([k, unu, multe]) => cate(k, unu, multe))
      .join(" · ");
  switch (tema) {
    case "sunat":
      return parti([[nr((x) => x.tip === "lead_nou"), "nou", "noi"], [nr((x) => x.tip === "callback"), "callback", "callback"]]);
    case "discutii": {
      const azi = nr((x) => x.urgenta === "azi");
      return azi ? `${azi} azi` : `${r.length} mâine`;
    }
    case "lucru":
      return parti([[nr((x) => x.tip === "task"), "task", "task-uri"], [nr((x) => x.tip !== "task"), "alta", "altele"]]);
    case "bani":
      return parti([[nr((x) => x.tip === "rata"), "rată", "rate"], [nr((x) => x.tip === "comision"), "comision", "comisioane"], [nr((x) => x.tip === "vanzare"), "vânzare", "vânzări"]]);
  }
}

/** Plăcile temelor care au rânduri, în ordinea De sunat, Discuții, Lucru, Bani. */
export function placi(r: RandAzi[]): Placa[] {
  return ORDINE_TEME.flatMap((tema) => {
    const ale = r.filter((x) => x.tema === tema);
    if (!ale.length) return [];
    const intarziate = ale.filter((x) => x.urgenta === "intarziat").length;
    return [{ tema, nume: NUME_TEMA[tema], total: ale.length, intarziate, rezumat: intarziate ? cate(intarziate, "întârziată", "întârziate") : rezumat(tema, ale) }];
  });
}

export type Cifra = { text: string; culoare: "red" | "amber" | "blue" | "violet" | "green" };

/** Rândul de pastile de sus; cele cu 0 nu apar. */
export function cifreSus(r: RandAzi[]): Cifra[] {
  const nr = (f: (x: RandAzi) => boolean) => r.filter(f).length;
  const c: [number, string, Cifra["culoare"]][] = [
    [nr((x) => x.urgenta === "intarziat"), cate(nr((x) => x.urgenta === "intarziat"), "întârziată", "întârziate"), "red"],
    [nr((x) => x.tema === "sunat"), `${nr((x) => x.tema === "sunat")} de sunat`, "amber"],
    [nr((x) => x.tip === "discutie" && x.urgenta === "azi"), `${cate(nr((x) => x.tip === "discutie" && x.urgenta === "azi"), "discuție", "discuții")} azi`, "blue"],
    [nr((x) => x.tip === "task" && x.urgenta === "azi"), `${cate(nr((x) => x.tip === "task" && x.urgenta === "azi"), "task", "task-uri")} azi`, "violet"],
    [nr((x) => x.tip === "rata"), `${cate(nr((x) => x.tip === "rata"), "rată", "rate")} de încasat`, "green"],
  ];
  return c.filter(([k]) => k > 0).map(([, text, culoare]) => ({ text, culoare }));
}

const ORA_RO = new Intl.DateTimeFormat("en-GB", { timeZone: FUS, hour: "2-digit", hourCycle: "h23" });
const ZI_TITLU = new Intl.DateTimeFormat("ro-RO", { timeZone: FUS, weekday: "long", day: "numeric", month: "long" });

/** „Bună dimineața” până la 12, „Bună ziua” până la 18, apoi „Bună seara” (ora României). */
export function salut(acum: Date): string {
  const h = Number(ORA_RO.format(acum));
  return h < 12 ? "Bună dimineața" : h < 18 ? "Bună ziua" : "Bună seara";
}

/** „Luni, 16 noiembrie”. */
export function ziTitlu(acum: Date): string {
  const s = ZI_TITLU.format(acum);
  return s.charAt(0).toUpperCase() + s.slice(1);
}
