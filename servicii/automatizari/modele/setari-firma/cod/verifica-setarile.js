// Verifică setările firmei înainte să le folosească vreun model.
// O greșeală aici oprește fluxul cu un mesaj clar (ajunge la fluxul de erori), în loc să trimită mesaje greșite.
const s = { ...$input.first().json };
const probleme = [];

// Listele pot veni ca text JSON din nodul Set.
for (const camp of ['program', 'oameni', 'servicii']) {
  if (typeof s[camp] === 'string') {
    try { s[camp] = JSON.parse(s[camp]); } catch (e) { probleme.push(`${camp}: nu e JSON valid (${e.message})`); }
  }
}

// Câmpurile rămase necompletate.
const necompletat = (v) => typeof v === 'string' && v.startsWith('CONFIG_');
for (const [camp, v] of Object.entries(s)) if (necompletat(v)) probleme.push(`${camp}: necompletat (${v})`);
for (const om of Array.isArray(s.oameni) ? s.oameni : []) {
  if (necompletat(om.calendar_id)) probleme.push(`oameni: calendarul lui ${om.nume} e necompletat`);
}

if (!['email', 'sms', 'ambele'].includes(s.canal)) probleme.push(`canal: „${s.canal}” nu e email, sms sau ambele`);

// Fiecare serviciu al unui om trebuie să existe în lista de servicii (cu durată și preț).
if (Array.isArray(s.oameni) && Array.isArray(s.servicii)) {
  const nume = new Set(s.servicii.map((x) => x.nume));
  for (const om of s.oameni) {
    for (const serv of om.servicii || []) {
      if (!nume.has(serv)) probleme.push(`oameni: ${om.nume} face „${serv}”, dar „${serv}” nu e în servicii`);
    }
  }
}

if (probleme.length) throw new Error('Setările firmei au probleme:\n- ' + probleme.join('\n- '));
return [{ json: s }];
