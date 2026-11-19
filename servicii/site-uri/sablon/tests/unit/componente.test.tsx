import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import type { Firma } from "@/lib/config";
import { ButoaneContact } from "@/components/ButoaneContact";
import { Subsol } from "@/components/Subsol";

const firma: Firma = {
  nume: "Firma Test",
  slug: "firma-test",
  domeniu: "firma-test.ro",
  url: "https://firma-test.ro",
  telefon: "0722 123 456",
  whatsapp: "0722 123 456",
  adresa: "Strada Test 1",
  harta: "https://maps.google.com/?q=test",
  retele: {},
  analytics: false,
  creditBuildwithac: true,
};

describe("butoanele de contact", () => {
  it("Sună duce la tel:", () => {
    render(<ButoaneContact firma={firma} />);
    expect(screen.getByRole("link", { name: "Sună" })).toHaveAttribute("href", "tel:+40722123456");
  });
  it("WhatsApp și harta se deschid în altă filă", () => {
    render(<ButoaneContact firma={firma} />);
    expect(screen.getByRole("link", { name: "WhatsApp" })).toHaveAttribute("href", "https://wa.me/40722123456");
    expect(screen.getByRole("link", { name: "Vezi pe hartă" })).toHaveAttribute("target", "_blank");
  });
  it("fără WhatsApp, fără buton", () => {
    render(<ButoaneContact firma={{ ...firma, whatsapp: null }} />);
    expect(screen.queryByRole("link", { name: "WhatsApp" })).toBeNull();
  });
});

describe("subsolul", () => {
  it("are creditul, cu link spre buildwithac", () => {
    render(<Subsol firma={firma} />);
    expect(screen.getByRole("link", { name: "Site făcut de buildwithac" })).toHaveAttribute(
      "href",
      "https://buildwithac.ro",
    );
  });
  it("creditul se poate scoate", () => {
    render(<Subsol firma={{ ...firma, creditBuildwithac: false }} />);
    expect(screen.queryByRole("link", { name: "Site făcut de buildwithac" })).toBeNull();
  });
  it("are link spre confidențialitate", () => {
    render(<Subsol firma={firma} />);
    expect(screen.getByRole("link", { name: "Confidențialitate" })).toHaveAttribute("href", "/confidentialitate");
  });
});
