import { Ascuns } from "@/components/Ascuns";
import { dePlatitOm, LUNI } from "@/lib/finante";
import { lei } from "@/lib/proiecte";
import { ziuaRomaniei } from "@/lib/timp";

export type ComisionulMeu = { id: string; tip: string; client: string | null; eticheta: string | null; procent: number | null; baza_lei: number; suma_lei: number | null; platit_la: string | null; creat_la: string };
export type ComisionViitor = { client: string; eticheta: string; suma_lei: number; procent: number | null; comision: number | null; scadenta: string | null };

const LUNI_SCURT = ["ian", "feb", "mar", "apr", "mai", "iun", "iul", "aug", "sep", "oct", "nov", "dec"];
const procentText = (p: number) => `${String(p).replace(".", ",")}%`;
const suma = (n: number | null) => (n === null ? "" : lei(n).replace(/^-/, "−"));

/** Ziua ca în calendar: „14” mare, „nov” mic. Fără zi: „în așteptare”. */
function Zi({ zi }: { zi: string | null }) {
  if (!zi) return <span className="w-[54px] flex-none text-center text-[11px] leading-tight text-ink-3">în așteptare</span>;
  return (
    <span className="w-[54px] flex-none text-center leading-none">
      <b className="num block text-[16px] font-semibold">{Number(zi.slice(8, 10))}</b>
      <small className="text-[11px] text-ink-3">{LUNI_SCURT[Number(zi.slice(5, 7)) - 1]}</small>
    </span>
  );
}

function Rand({ zi, client, detalii, valoare, minus = false, sters = false }: { zi: string | null; client: string | null; detalii: string; valoare: string; minus?: boolean; sters?: boolean }) {
  return (
    <div data-testid="rand-comision" className={`flex items-center gap-3 border-b border-line px-3.5 py-2.5 last:border-0 ${sters ? "opacity-70" : ""}`}>
      <Zi zi={zi} />
      <div className="min-w-0 flex-1 text-[13px]">
        <span className="text-ink-2">
          {client ? <Ascuns>{client}</Ascuns> : <span className="text-ink-3">client șters</span>} · {detalii}
        </span>
      </div>
      <b className={`num flex-none text-[13.5px] font-semibold ${minus ? "text-red-t" : ""}`}>{valoare}</b>
    </div>
  );
}

function Lista({ cheie, titlu, culoare, dreapta, gol, children }: { cheie: string; titlu: string; culoare?: string; dreapta: string; gol: string; children: React.ReactNode[] }) {
  return (
    <section data-testid={`lista-${cheie}`} className="mb-4">
      <div className="mb-2 flex items-baseline gap-2 px-1">
        <span className={`lbl ${culoare ?? ""}`}>{titlu}</span>
        <span className="num ml-auto text-[12.5px] text-ink-3">{dreapta}</span>
      </div>
      <div className="panel">{children.length ? children : <p className="px-3.5 py-4 text-[13px] text-ink-3">{gol}</p>}</div>
    </section>
  );
}

/** Pagina „Finanțe” la constructor, closer și caller: doar comisioanele lor. Nu vede cine întârzie, nici banii altora. */
export function ComisioaneleMele({ mele, viitoare, azi }: { mele: ComisionulMeu[]; viitoare: ComisionViitor[]; azi: string }) {
  const luna = LUNI[Number(azi.slice(5, 7)) - 1];
  const neplatite = mele.filter((k) => !k.platit_la);
  const primite = mele.filter((k) => k.platit_la).sort((a, b) => b.platit_la!.localeCompare(a.platit_la!) || b.creat_la.localeCompare(a.creat_la));
  const { total } = dePlatitOm(neplatite);
  const primitLuna = primite.filter((k) => k.platit_la!.slice(0, 7) === azi.slice(0, 7)).reduce((s, k) => s + (k.suma_lei ?? 0), 0);
  const viitor = viitoare.reduce((s, k) => s + (k.comision ?? 0), 0);
  // cele fără dată (în așteptare) sus, apoi după zi
  const urmeaza = [...viitoare].sort((a, b) => (a.scadenta ?? "").localeCompare(b.scadenta ?? ""));

  const detaliiMele = (k: ComisionulMeu) =>
    k.tip === "minus" ? `${k.eticheta ?? "tranșă ștearsă"} · returnare` : `${k.eticheta ?? "tranșă ștearsă"} · ${k.procent === null ? "procent nestabilit" : `${procentText(k.procent)} din ${lei(k.baza_lei)}`}`;

  return (
    <>
      <div className="mb-5 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        <div className="panel col-span-2 px-3.5 py-3 sm:col-span-1">
          <small className="text-[12px] text-ink-3">De primit</small>
          <b className={`num mt-0.5 block text-[19px] font-semibold tracking-[-.02em] sm:text-[21px] ${total < 0 ? "text-red-t" : "text-amber"}`}>{suma(total)}</b>
        </div>
        <div className="panel px-3.5 py-3">
          <small className="text-[12px] text-ink-3">Primit în {luna}</small>
          <b className="num mt-0.5 block text-[17px] font-semibold tracking-[-.02em] text-green sm:text-[21px]">{lei(primitLuna)}</b>
        </div>
        <div className="panel px-3.5 py-3">
          <small className="text-[12px] text-ink-3">Urmează, dacă plătesc clienții</small>
          <b className="num mt-0.5 block text-[17px] font-semibold tracking-[-.02em] sm:text-[21px]">{lei(viitor)}</b>
        </div>
      </div>

      <Lista cheie="de-primit" titlu="De primit" culoare="text-amber" dreapta={suma(total)} gol="Nimic de primit acum.">
        {neplatite.map((k) => (
          <Rand key={k.id} zi={ziuaRomaniei(new Date(k.creat_la))} client={k.client} detalii={detaliiMele(k)} valoare={suma(k.suma_lei)} minus={k.tip === "minus"} sters={!k.client} />
        ))}
      </Lista>
      <Lista cheie="urmeaza" titlu="Urmează" dreapta="după ce intră banii de la client" gol="Nimic programat.">
        {urmeaza.map((k, i) => (
          <Rand
            key={`${k.client}|${k.eticheta}|${k.scadenta}|${i}`}
            zi={k.scadenta}
            client={k.client}
            detalii={`${k.eticheta} · ${k.procent === null ? "procent nestabilit" : `${procentText(k.procent)} din ${lei(k.suma_lei)}`}`}
            valoare={suma(k.comision)}
          />
        ))}
      </Lista>
      <Lista cheie="primite" titlu="Primite" culoare="text-green" dreapta={`${lei(primitLuna)} în ${luna}`} gol="Încă n-ai primit nimic.">
        {primite.slice(0, 30).map((k) => (
          <Rand key={k.id} zi={k.platit_la} client={k.client} detalii={detaliiMele(k)} valoare={suma(k.suma_lei)} minus={k.tip === "minus"} sters={!k.client} />
        ))}
      </Lista>
    </>
  );
}
