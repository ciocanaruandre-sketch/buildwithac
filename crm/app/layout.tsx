import type { Metadata, Viewport } from "next";
import "./tema.css";

export const metadata: Metadata = {
  title: "CRM buildwithac",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { viewportFit: "cover", themeColor: "#141417" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ro">
      <body className="antialiased">
        <div className="perete" aria-hidden>
          <i className="w1" />
          <i className="w2" />
          <i className="w3" />
        </div>
        <div className="relative z-[1]">{children}</div>
      </body>
    </html>
  );
}
