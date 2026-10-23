const R = 48;
const L = 2 * Math.PI * R;

export function CercProgres({ bifate, total }: { bifate: number; total: number }) {
  return (
    <div className="k-count" aria-live="polite">
      <div className="ring">
        <svg viewBox="0 0 112 112" aria-hidden>
          <defs>
            <linearGradient id="cerc-grad" x1="0" x2="1">
              <stop offset="0" stopColor="#ffb52e" /><stop offset=".5" stopColor="#f26a21" /><stop offset="1" stopColor="#e53222" />
            </linearGradient>
          </defs>
          <circle cx="56" cy="56" r={R} fill="none" stroke="rgba(255,255,255,.1)" strokeWidth="7" />
          <circle className="arc" cx="56" cy="56" r={R} fill="none" stroke="url(#cerc-grad)" strokeWidth="7" strokeLinecap="round"
            strokeDasharray={L} strokeDashoffset={L * (1 - (total ? bifate / total : 0))} />
        </svg>
        <b>{bifate}/{total}</b>
      </div>
      <span>pași bifați</span>
    </div>
  );
}
