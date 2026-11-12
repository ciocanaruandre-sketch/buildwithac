/**
 * Date personale ale unui lead sau client (nume, firmă, telefon, e-mail, cont): în modul filmare
 * se blurează din CSS (`[data-filmare] .ascuns` în tema.css). Fără modul filmare e un span obișnuit.
 */
export function Ascuns({ children }: { children: React.ReactNode }) {
  return <span className="ascuns">{children}</span>;
}
