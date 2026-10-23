"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Lupa } from "./Lupa";

/** Lupa care, la Enter, deschide /ghiduri cu căutarea completată (folosită pe 404). */
export function LupaSpreGhiduri() {
  const [q, setQ] = useState("");
  const router = useRouter();
  return <Lupa valoare={q} onSchimba={setQ} onTrimite={(v) => router.push(`/ghiduri?q=${encodeURIComponent(v.trim())}`)} />;
}
