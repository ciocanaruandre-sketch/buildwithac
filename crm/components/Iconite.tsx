export type NumeIconita = "lead-uri" | "clienti" | "taskuri" | "program" | "echipa" | "iesi" | "cauta" | "filmare";

/** Desenele din prototip/crm-tema.html (i-inbox, i-users, i-check, i-cal, i-team, i-search), plus ieșirea. */
const DESENE: Record<NumeIconita, React.ReactNode> = {
  "lead-uri": (
    <>
      <path d="M3 13l3-8h12l3 8v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <path d="M3 13h5l1 3h6l1-3h5" />
    </>
  ),
  clienti: (
    <>
      <circle cx="9" cy="8" r="4" />
      <path d="M2 21c0-4 3-6 7-6s7 2 7 6" />
      <path d="M16 4a4 4 0 0 1 0 8M22 21c0-3-2-5-4-5.6" />
    </>
  ),
  taskuri: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12l3 3 5-6" />
    </>
  ),
  program: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="3" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </>
  ),
  echipa: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
    </>
  ),
  iesi: (
    <>
      <path d="M14 4h3a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3h-3" />
      <path d="M10 8l-4 4 4 4M6 12h10" />
    </>
  ),
  cauta: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.5-3.5" />
    </>
  ),
  // o cameră de filmat: modul filmare
  filmare: (
    <>
      <rect x="2.5" y="6" width="13" height="12" rx="3" />
      <path d="M15.5 10.5l6-3.5v10l-6-3.5" />
    </>
  ),
};

export function Iconita({ nume, className }: { nume: NumeIconita; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={24}
      height={24}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={className}
    >
      {DESENE[nume]}
    </svg>
  );
}
