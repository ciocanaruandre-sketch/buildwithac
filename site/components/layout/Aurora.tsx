"use client";

import { useEffect, useRef, type CSSProperties } from "react";

const PANGLICI: CSSProperties[] = [
  { ["--r" as string]: "-10deg", top: "8%", background: "linear-gradient(90deg,transparent,#ffb52e,#f26a21,transparent)" },
  { ["--r" as string]: "7deg", top: "42%", background: "linear-gradient(90deg,transparent,#e53222,#f26a21,transparent)", animationDelay: "-6s" },
  { ["--r" as string]: "-4deg", top: "72%", background: "linear-gradient(90deg,transparent,#7a0e0e,#e53222,transparent)", animationDelay: "-11s", opacity: 0.5 },
];

// un singur observator pentru toate fundalurile: panglicile se animă doar lângă ecran,
// altfel fiecare panglică animată ține un strat mare în memoria video a telefonului
let observator: IntersectionObserver | undefined;
const obs = () =>
  (observator ??= new IntersectionObserver(
    (intrari) => intrari.forEach((i) => i.target.toggleAttribute("data-activ", i.isIntersecting)),
    { rootMargin: "200px 0px" },
  ));

/** Fundalul „Aurora (panglici de lumină)”. Secțiunea părinte primește clasa `bgs`. */
export function Aurora() {
  const el = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const nod = el.current!;
    obs().observe(nod);
    return () => obs().unobserve(nod);
  }, []);
  return (
    <div className="secbg" aria-hidden ref={el} data-fara-tipar>
      {PANGLICI.map((s, i) => <div key={i} className="rib" style={s} />)}
      <div className="grain" />
    </div>
  );
}
