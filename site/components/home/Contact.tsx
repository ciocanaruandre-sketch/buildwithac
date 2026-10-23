import { Aurora } from "@/components/layout/Aurora";
import { SITE } from "@/lib/config";

export function Contact() {
  return (
    <section className="contact bgs" id="contact">
      <Aurora />
      <div className="eb">Contact</div>
      <h2>Ai o întrebare? <span className="serif gtxt">Scrie-mi.</span></h2>
      <p className="intro">Despre un ghid, o idee de clip sau AI-ul din firma ta. Răspund eu, nu un robot.</p>
      <div className="cways">
        <a className="cway" href={SITE.instagram.url} target="_blank" rel="noopener">
          <span className="arr" aria-hidden>↗</span><div className="ic" aria-hidden>IG</div>
          <h3>Mesaj pe Instagram</h3>
          <p>Cel mai rapid. Îmi scrii în privat și îți răspund acolo.</p>
          <span className="h gtxt">{SITE.instagram.handle}</span>
        </a>
        <a className="cway" href={`mailto:${SITE.emailContact}`}>
          <span className="arr" aria-hidden>↗</span><div className="ic" aria-hidden>@</div>
          <h3>E-mail</h3>
          <p>Pentru firme, colaborări sau întrebări mai lungi.</p>
          <span className="h gtxt">{SITE.emailContact}</span>
        </a>
      </div>
      <div className="note2 hand">răspund de obicei în 1–2 zile</div>
    </section>
  );
}
