"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { SITE } from "@/lib/config";
import { lenis } from "@/components/layout/LenisProvider";

const LINKURI = [
  { href: "/ghiduri", text: "Ghiduri" },
  { href: "/#cine", text: "Pentru cine" },
  { href: "/#portofoliu", text: "Portofoliu" },
  { href: "/#servicii", text: "Servicii" },
  { href: "/#contact", text: "Contact" },
];
const SOCIAL = [
  { href: SITE.instagram.url, text: "Instagram", ic: "IG" },
  { href: SITE.tiktok.url, text: "TikTok", ic: "TT" },
];

export function Nav() {
  const [socialDeschis, setSocialDeschis] = useState(false);
  const [meniuDeschis, setMeniuDeschis] = useState(false);
  const dd = useRef<HTMLDivElement>(null);

  // pe telefon nu există hover: meniul Social media se închide la click în afara lui
  useEffect(() => {
    const inchide = (e: MouseEvent) => { if (!dd.current?.contains(e.target as Node)) setSocialDeschis(false); };
    document.addEventListener("click", inchide);
    return () => document.removeEventListener("click", inchide);
  }, []);

  useEffect(() => {
    if (!meniuDeschis) return;
    const tasta = (e: KeyboardEvent) => e.key === "Escape" && setMeniuDeschis(false);
    document.addEventListener("keydown", tasta);
    lenis.curent?.stop();
    return () => { document.removeEventListener("keydown", tasta); lenis.curent?.start(); };
  }, [meniuDeschis]);

  const [ghiduri, cine, ...restul] = LINKURI;
  return (
    <nav className="nav" aria-label="Principal" data-fara-tipar>
      <Link href="/" className="logo" aria-label="buildwithac, acasă">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.webp" alt="" width={44} height={44} />
      </Link>
      <div className="links">
        <Link href={ghiduri.href}>{ghiduri.text}</Link>
        <Link href={cine.href}>{cine.text}</Link>
        <div className={`dd${socialDeschis ? " on" : ""}`} ref={dd}>
          <button type="button" aria-expanded={socialDeschis} onClick={() => setSocialDeschis((x) => !x)}>
            Social media <i>▾</i>
          </button>
          <div className="ddm">
            {SOCIAL.map((s) => (
              <a key={s.text} href={s.href} target="_blank" rel="noopener"><span className="ic-s">{s.ic}</span>{s.text}</a>
            ))}
          </div>
        </div>
        {restul.map((l) => <Link key={l.href} href={l.href}>{l.text}</Link>)}
      </div>
      <button type="button" className="burger" aria-label="Meniu" aria-expanded={meniuDeschis} onClick={() => setMeniuDeschis(true)}>☰</button>
      {meniuDeschis && (
        <div className="mmenu" role="dialog" aria-modal="true" aria-label="Meniu" data-lenis-prevent>
          <button type="button" className="x" aria-label="Închide meniul" onClick={() => setMeniuDeschis(false)} autoFocus>✕</button>
          {LINKURI.map((l) => <Link key={l.href} href={l.href} onClick={() => setMeniuDeschis(false)}>{l.text}</Link>)}
          <div className="soc">
            {SOCIAL.map((s) => <a key={s.text} href={s.href} target="_blank" rel="noopener">{s.text}</a>)}
          </div>
        </div>
      )}
    </nav>
  );
}
