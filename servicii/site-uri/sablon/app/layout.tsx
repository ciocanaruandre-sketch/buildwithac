import type { Metadata } from "next";
import { preload } from "react-dom";
import { Analytics } from "@vercel/analytics/next";
import "./fonturi.css";
import "./globals.css";
import { LenisProvider } from "@/components/Lenis";
import { Subsol } from "@/components/Subsol";
import { FIRMA } from "@/lib/config";
import { CONTINUT } from "@/lib/continut";

export const metadata: Metadata = {
  metadataBase: new URL(FIRMA.url),
  title: CONTINUT.titlu,
  description: CONTINUT.descriere,
  openGraph: { siteName: FIRMA.nume, locale: "ro_RO", type: "website", images: ["/og.jpg"] },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  // textul se vede din primul ecran: fontul se cere devreme
  preload("/fonts/inter-latin.woff2", { as: "font", type: "font/woff2", crossOrigin: "anonymous" });
  return (
    <html lang="ro" className="antialiased">
      <body className="min-h-full">
        <LenisProvider>
          {children}
          <Subsol />
        </LenisProvider>
        {FIRMA.analytics && <Analytics />}
      </body>
    </html>
  );
}
