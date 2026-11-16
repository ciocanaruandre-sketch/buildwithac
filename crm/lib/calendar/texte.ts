/** Mesajul după „Deconectează”, când unele evenimente n-au putut fi șterse din Google Calendar. */
export function textNesterse(n: number): string {
  if (n === 1) return "Un eveniment n-a putut fi șters. Șterge-l de mână din Google Calendar.";
  const cate = n % 100 >= 20 || n % 100 === 0 ? `${n} de evenimente` : `${n} evenimente`;
  return `${cate} n-au putut fi șterse. Șterge-le de mână din Google Calendar.`;
}
