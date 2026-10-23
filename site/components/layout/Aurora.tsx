import type { CSSProperties } from "react";

const PANGLICI: CSSProperties[] = [
  { ["--r" as string]: "-10deg", top: "8%", background: "linear-gradient(90deg,transparent,#ffb52e,#f26a21,transparent)" },
  { ["--r" as string]: "7deg", top: "42%", background: "linear-gradient(90deg,transparent,#e53222,#f26a21,transparent)", animationDelay: "-6s" },
  { ["--r" as string]: "-4deg", top: "72%", background: "linear-gradient(90deg,transparent,#7a0e0e,#e53222,transparent)", animationDelay: "-11s", opacity: 0.5 },
];

/** Fundalul „Aurora (panglici de lumină)”. Secțiunea părinte primește clasa `bgs`. */
export function Aurora() {
  return (
    <div className="secbg" aria-hidden>
      {PANGLICI.map((s, i) => <div key={i} className="rib" style={s} />)}
      <div className="grain" />
    </div>
  );
}
