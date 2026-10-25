import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { CeVezi } from "@/components/ghid/Notite";

describe("CeVezi", () => {
  it("cu fișierul pe disc, arată imaginea", () => {
    const { container } = render(<CeVezi src="directii.webp" alt="Cele 3 direcții" dosar="site-uri-fara-aer-de-ai" />);
    expect(container.querySelector("img")).not.toBeNull();
  });

  it("fără fișier, arată locul marcat, nu o imagine spartă", () => {
    const { container } = render(<CeVezi src="nu-exista.webp" alt="Pagina de start" dosar="site-uri-fara-aer-de-ai" />);
    expect(screen.getByText("captură de pus: Pagina de start")).toBeInTheDocument();
    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector("figure.shot.lipsa")).not.toBeNull();
  });
});
