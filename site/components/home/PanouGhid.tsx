"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import type { GhidCard } from "@/lib/ghiduri";
import { imagineGhid } from "@/lib/imagine";
import { lenis } from "@/components/layout/LenisProvider";

export function PanouGhid({ ghid, onClose }: { ghid: GhidCard; onClose: () => void }) {
  const panou = useRef<HTMLElement>(null);

  useEffect(() => {
    panou.current?.querySelector<HTMLElement>(".x")?.focus();
    lenis.curent?.stop();
    const tasta = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key !== "Tab" || !panou.current) return;
      // focusul rămâne în panou
      const f = panou.current.querySelectorAll<HTMLElement>("button, a[href]");
      const [primul, ultimul] = [f[0], f[f.length - 1]];
      if (e.shiftKey && document.activeElement === primul) { e.preventDefault(); ultimul.focus(); }
      else if (!e.shiftKey && document.activeElement === ultimul) { e.preventDefault(); primul.focus(); }
    };
    document.addEventListener("keydown", tasta);
    return () => { document.removeEventListener("keydown", tasta); lenis.curent?.start(); };
  }, [onClose]);

  // în body, ca să nu rămână sub bara de sus (secțiunea are propriul context de stivuire)
  return createPortal(
    <>
      <div className="drawer-bg" onClick={onClose} />
      <aside className="drawer" ref={panou} role="dialog" aria-modal="true" aria-labelledby="panou-titlu" data-lenis-prevent>
        <button type="button" className="x" aria-label="Închide" onClick={onClose}>✕</button>
        <div className="cover"><Image src={imagineGhid(ghid, ghid.imagine)} alt="" fill sizes="520px" /></div>
        <div className="in">
          <div className="eb">Ghid gratuit</div>
          <h3 id="panou-titlu">{ghid.titlu}</h3>
          <div className="chips">
            <span className="free">Gratuit</span>
            <span>{ghid.durata}</span>
            <span>{ghid.nivel[0].toUpperCase() + ghid.nivel.slice(1)}</span>
            <span>{ghid.pasi.length} pași</span>
          </div>
          <p>{ghid.descriere}</p>
          <h4>Ce găsești în ghid</h4>
          <ul>{ghid.ceGasesti.map((x) => <li key={x}>{x}</li>)}</ul>
          <h4>Cuprins</h4>
          <ol>{ghid.pasi.map((p) => <li key={p.id}>{p.titlu}</li>)}</ol>
          <Link className="cta" href={`/ghiduri/${ghid.slug}`}>Citește ghidul →</Link>
        </div>
      </aside>
    </>,
    document.body,
  );
}
