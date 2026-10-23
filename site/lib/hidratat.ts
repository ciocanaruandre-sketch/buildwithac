import { useSyncExternalStore } from "react";

const nimic = () => () => {};

/** false la randarea pe server și până se hidratează pagina, apoi true. */
export const useHidratat = () => useSyncExternalStore(nimic, () => true, () => false);
