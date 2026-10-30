import { useEffect, type RefObject } from "react";

const FOCUSABILE = 'a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])';

/** Cât e deschisă o fereastră, Tab și Shift+Tab se rotesc în ea și nu ajung în pagina din spate. */
export function useCapcanaFocus(ref: RefObject<HTMLElement | null>, activ: boolean): void {
  useEffect(() => {
    if (!activ) return;
    const tasta = (e: KeyboardEvent) => {
      if (e.key !== "Tab" || !ref.current) return;
      const el = [...ref.current.querySelectorAll<HTMLElement>(FOCUSABILE)];
      if (!el.length) return;
      // mutăm noi focusul la fiecare Tab: Safari sare peste link-uri și ar ieși din fereastră
      e.preventDefault();
      const i = el.indexOf(document.activeElement as HTMLElement);
      const pas = e.shiftKey ? -1 : 1;
      el[i < 0 ? (e.shiftKey ? el.length - 1 : 0) : (i + pas + el.length) % el.length].focus();
    };
    document.addEventListener("keydown", tasta);
    return () => document.removeEventListener("keydown", tasta);
  }, [ref, activ]);
}
