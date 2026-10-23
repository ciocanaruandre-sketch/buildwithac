const cheie = (slug: string) => `ghid:${slug}:pasi`;

export function citesteProgres(slug: string): string[] {
  try {
    const valoare = JSON.parse(localStorage.getItem(cheie(slug)) ?? "[]");
    return Array.isArray(valoare) && valoare.every((x) => typeof x === "string") ? valoare : [];
  } catch {
    return [];
  }
}

export function scrieProgres(slug: string, pasi: string[]): void {
  try {
    localStorage.setItem(cheie(slug), JSON.stringify(pasi));
  } catch {
    // fără localStorage (navigare privată): bifele rămân doar în sesiunea curentă
  }
}
