import { Formular } from "@/components/Formular";
import { seteazaParola } from "../actiuni";

export default function Parola() {
  return (
    <>
      <h1 className="mb-2 text-xl font-bold">Alege-ți parola</h1>
      <p className="mb-4 text-[13px] text-ink-2">Cel puțin 10 caractere. O folosești de fiecare dată când intri.</p>
      <Formular
        actiune={seteazaParola}
        buton="Salvează parola"
        campuri={[
          { nume: "parola", eticheta: "Parola nouă", tip: "password", autocomplete: "new-password" },
          { nume: "parola2", eticheta: "Încă o dată", tip: "password", autocomplete: "new-password" },
        ]}
      />
    </>
  );
}
