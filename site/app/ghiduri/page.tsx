import type { Metadata } from "next";
import "@/components/ghiduri/ghiduri.css";
import { faraCorp, toateGhidurile } from "@/lib/ghiduri";
import { Aurora } from "@/components/layout/Aurora";
import { Colaj } from "@/components/ghiduri/Colaj";

export const metadata: Metadata = {
  title: "Toate ghidurile · buildwithac",
  description: "Ghiduri gratuite, pas cu pas, pentru tot ce vezi pe TikTok la @buildwithac.ai.",
};

export default function PaginaGhiduri() {
  return (
    <main className="toate-ghid">
      <Aurora />
      <Colaj ghiduri={toateGhidurile().map(faraCorp)} />
    </main>
  );
}
