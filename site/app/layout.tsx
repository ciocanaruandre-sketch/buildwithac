import type { Metadata } from "next";
import { Unbounded, Inter, Instrument_Serif, Caveat, Anton, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const unbounded = Unbounded({ variable: "--nf-unbounded", subsets: ["latin", "latin-ext"], weight: ["600", "800"] });
const inter = Inter({ variable: "--nf-inter", subsets: ["latin", "latin-ext"], weight: ["400", "500", "600", "700"] });
const serif = Instrument_Serif({ variable: "--nf-serif", subsets: ["latin", "latin-ext"], weight: "400", style: ["normal", "italic"] });
const caveat = Caveat({ variable: "--nf-caveat", subsets: ["latin", "latin-ext"], weight: ["600", "700"] });
const anton = Anton({ variable: "--nf-anton", subsets: ["latin", "latin-ext"], weight: "400" });
const mono = JetBrains_Mono({ variable: "--nf-mono", subsets: ["latin", "latin-ext"], weight: ["400", "500"] });

export const metadata: Metadata = {
  title: "buildwithac — AI pe înțelesul tău, în română",
  description: "Ghiduri gratuite, pas cu pas, ca să folosești AI în munca ta.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  const fonturi = [unbounded, inter, serif, caveat, anton, mono].map((f) => f.variable).join(" ");
  return (
    <html lang="ro" className={`${fonturi} antialiased`}>
      <body className="font-inter bg-ink text-cream min-h-full">{children}</body>
    </html>
  );
}
