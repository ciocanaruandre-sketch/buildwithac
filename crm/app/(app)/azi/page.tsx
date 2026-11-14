import { BaraSus } from "@/components/BaraSus";
import { PaginaAzi } from "@/components/azi/PaginaAzi";
import { cifreSus, ordoneaza, placi, randuriAzi, salut, ziTitlu } from "@/lib/azi";
import { citesteAzi } from "@/lib/azi-date";
import { eu } from "@/lib/eu";

/** „Azi”: ce ai de făcut acum și în zilele următoare. Prima pagină după intrare, la toate rolurile. */
export default async function Azi() {
  const om = await eu();
  const acum = new Date();
  const randuri = ordoneaza(randuriAzi(await citesteAzi(om, acum), om, acum));
  return (
    <>
      <BaraSus cale={[{ eticheta: "Azi" }]} />
      <PaginaAzi randuri={randuri} placi={placi(randuri)} cifre={cifreSus(randuri)} salut={`${salut(acum)}, ${om.nume.split(/\s+/)[0]}`} zi={ziTitlu(acum)} om={{ id: om.id, rol: om.rol }} />
    </>
  );
}
