const FORMAT = new Intl.DateTimeFormat("ro-RO", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Bucharest" });

/** „21 octombrie 2026” */
export const formatData = (d: Date) => FORMAT.format(d);
