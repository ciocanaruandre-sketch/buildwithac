import Image from "next/image";
import Link from "next/link";
import type { GhidCard } from "@/lib/ghiduri";
import { imagineGhid } from "@/lib/imagine";
import { SITE } from "@/lib/config";
import { FormularAbonare } from "@/components/FormularAbonare";

export function FinalGhid({ urmator }: { urmator?: GhidCard }) {
  return (
    <section className="end" data-fara-tipar>
      <h2>Ți-a fost util? <span className="serif gtxt">Hai mai departe.</span></h2>
      <p className="sub">Pe TikTok îți arăt ideea în 60 de secunde. Aici găsești restul.</p>
      <div className="endgrid">
        <div className="ecard">
          <div className="ic" aria-hidden>TT</div>
          <h3>Urmărește-mă</h3>
          <p>Clipuri scurte cu AI, explicate în română.</p>
          <div className="btns">
            <a className="g" href={SITE.tiktok.url} target="_blank" rel="noopener">TikTok</a>
            <a href={SITE.instagram.url} target="_blank" rel="noopener">Instagram</a>
          </div>
        </div>
        <div className="ecard">
          <div className="ic" aria-hidden>@</div>
          <h3>Află primul de ghidul nou</h3>
          <FormularAbonare varianta="card" />
        </div>
        {urmator && (
          <Link className="ecard next" href={`/ghiduri/${urmator.slug}`}>
            <div className="im"><Image src={imagineGhid(urmator, urmator.imagine)} alt="" fill sizes="320px" /></div>
            <div className="in">
              <div className="eb">Ghidul următor →</div>
              <h3>{urmator.titlu}</h3>
              <p>{urmator.descriere}</p>
            </div>
          </Link>
        )}
      </div>
      <Link className="toate" href="/ghiduri">Toate ghidurile →</Link>
    </section>
  );
}
