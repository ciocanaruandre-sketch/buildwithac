import Image from "next/image";
import Link from "next/link";
import type { GhidCard } from "@/lib/ghiduri";
import { imagineGhid } from "@/lib/imagine";

const Nivel = ({ n }: { n: string }) => <>{n[0].toUpperCase() + n.slice(1)}</>;

export function CardGhid({ ghid, mare, exact }: { ghid: GhidCard; mare?: boolean; exact?: boolean }) {
  const clase = `gc${mare ? " feat" : ""}${exact ? " potrivit" : ""}`;
  const poza = (
    <span className="ph">
      <Image src={imagineGhid(ghid, ghid.imagine)} alt="" fill sizes={mare ? "(max-width: 760px) 100vw, 640px" : "(max-width: 600px) 100vw, 380px"} />
      <b>GHID · {ghid.durata.toUpperCase()}</b>
    </span>
  );
  return (
    <Link className={clase} href={`/ghiduri/${ghid.slug}`}>
      <span className="tape" />
      {mare && <span className="sticker" aria-hidden>ghid<br />nou!</span>}
      {poza}
      <span className={mare ? "txt" : undefined}>
        <span className="t">{ghid.titlu}</span>
        <span className="d">{ghid.descriere}</span>
        <span className="meta"><span><Nivel n={ghid.nivel} /> · Gratuit</span><span className="kw">{ghid.cuvant}</span></span>
        {mare && <span className="go">Citește ghidul →</span>}
      </span>
      {exact && <span className="found hand">ăsta e ghidul din clip ✓</span>}
    </Link>
  );
}
