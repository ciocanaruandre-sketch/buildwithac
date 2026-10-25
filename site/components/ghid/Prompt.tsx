"use client";

import { useRef, useState } from "react";

export function Prompt({ children }: { children: React.ReactNode }) {
  const text = useRef<HTMLPreElement>(null);
  const [copiat, setCopiat] = useState(false);

  async function copiaza() {
    try {
      await navigator.clipboard.writeText(text.current?.innerText.trim() ?? "");
      setCopiat(true);
      setTimeout(() => setCopiat(false), 2000);
    } catch {
      // fără acces la clipboard: textul rămâne de selectat de mână
    }
  }

  return (
    <div className="prompt">
      <div className="ph"><span>Prompt</span><button type="button" onClick={copiaza} data-fara-tipar>{copiat ? "Copiat ✓" : "Copiază"}</button></div>
      <pre ref={text}>{children}</pre>
    </div>
  );
}
