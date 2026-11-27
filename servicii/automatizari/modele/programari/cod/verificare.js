// Fluxul programat (la 30 de minute, în programul firmei): reamintirile înainte de programare, anunțul când o programare
// s-a mutat și, după programare, cererea de recenzie.
// Intrarea: programările din calendarele tuturor oamenilor, din ultimele zile până peste 2 zile (cu evenimentele recurente desfăcute).
// Ieșirea: câte un mesaj de trimis (sau de sărit) pe canal.
const setari = $('Setări firmă').first().json;
const acum = $now.toMillis();

// ---------- comune (același text în toate fișierele cod/ care le au) ----------
// Fără diacritice și fără semnele care scumpesc SMS-ul (cu ele, un SMS costă dublu).
const faraDiacritice = (text) => String(text || '')
  .normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[„”“″]/g, '"').replace(/[‘’‚′]/g, "'").replace(/[–—]/g, '-').replace(/…/g, '...').replace(/ /g, ' ');

// Telefonul în forma +407…, oricum ar fi scris; null dacă nu e un număr bun pentru SMS.
const telefonRo = (text) => {
  let n = String(text || '').replace(/[^\d+]/g, '');
  n = n.replace(/^(\+|00)400/, '$140'); // „+40 (0) 722…”: zeroul dintre paranteze
  if (n.startsWith('00')) n = '+' + n.slice(2);
  else if (n.startsWith('0')) n = '+40' + n.slice(1);
  else if (n.startsWith('40')) n = '+' + n;
  return /^\+407\d{8}$/.test(n) || /^\+(?!40)[1-9]\d{8,14}$/.test(n) ? n : null;
};

// Telefonul și e-mailul din descrierea programării (text simplu sau HTML, cum o salvează Google Calendar).
const citesteContact = (descriere) => {
  const text = String(descriere || '')
    .replace(/<br\s*\/?>/gi, '\n').replace(/<\/(p|div|li)>/gi, '\n').replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&');
  const email = (text.match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/) || [null])[0];
  let telefon = null;
  for (const rand of text.split('\n')) {
    const m = rand.match(/tel(?:efon)?\s*[:.]?\s*([+\d][\d\s.()\/-]{7,})/i);
    if (m && (telefon = telefonRo(m[1]))) break;
  }
  if (!telefon) {
    const m = text.match(/(?:\+40|0040|\b0)\s?7\d{2}[\s.-]?\d{3}[\s.-]?\d{3}/);
    telefon = m ? telefonRo(m[0]) : null;
  }
  return { telefon, email: email ? email.toLowerCase() : null };
};

// Ziua și ora în ora României, oricum vin din Google (cu „Z” sau cu fus).
const oraRo = (iso) => {
  const d = new Date(iso);
  const p = (o) => new Intl.DateTimeFormat('ro-RO', { timeZone: 'Europe/Bucharest', ...o }).format(d);
  return { zi: `${p({ weekday: 'long' })}, ${p({ day: 'numeric' })} ${p({ month: 'long' })}`, ora: p({ hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }) };
};
// ---------- sfârșitul celor comune ----------

// Titlul programării: „<Serviciul> – <Numele clientului>”.
const desparteTitlul = (titlu) => {
  const [serviciu, ...rest] = String(titlu || '').split(/\s+[–—-]\s+/);
  const client = rest.join(' - ').trim();
  return { serviciu: serviciu.trim(), client, prenume: client.split(/\s+/)[0] || '' };
};
const randuri = (nume) => $(nume).all().map((i) => i.json).filter((r) => r && Object.keys(r).length);
const oraIso = (t) => { const d = new Date(t); return isNaN(d) ? String(t || '') : d.toISOString(); };
const cheie = (c) => telefonRo(c) || String(c || '').trim().toLowerCase();

const jurnal = randuri('Jurnal');
const nuTrimite = new Set(randuri('Nu trimite').map((r) => cheie(r.contact)));
const deja = (m) => jurnal.some((r) => r.eveniment_id === m.eveniment_id && oraIso(r.ora_programare) === m.ora_programare && r.tip === m.tip && (!r.contact || cheie(r.contact) === cheie(m.contact)));

// Pe ce canale pleacă: cele din setări; dacă clientul n-a lăsat contactul cerut, pe celălalt.
const tinte = ({ telefon, email }) => {
  const vrea = setari.canal === 'ambele' ? ['sms', 'email'] : [setari.canal];
  const are = { sms: telefon, email };
  const alese = vrea.filter((c) => are[c]);
  return (alese.length ? alese : ['sms', 'email'].filter((c) => are[c])).map((canal) => ({ canal, contact: are[canal] }));
};

const omul = (e) => e.om || (setari.oameni.find((o) => String(o.calendar_id || '').toLowerCase() === String((e.organizer && e.organizer.email) || '').toLowerCase()) || {}).nume || '';

// Ultima oră cunoscută de client pentru o programare: din ultimul mesaj trimis despre ea.
const STIUTE = ['confirmare', 'mutata', 'reamintire_1', 'reamintire_2'];
const oraStiuta = (eveniment_id, contact) => {
  const r = jurnal.filter((x) => x.eveniment_id === eveniment_id && STIUTE.includes(x.tip) && (!x.contact || cheie(x.contact) === cheie(contact)));
  return r.length ? oraIso(r[r.length - 1].ora_programare) : null;
};

// Ce reamintire e la rând, după cât mai e până la programare. Nu trimite reamintirea dacă programarea
// a fost făcută oricum cu mai puțin de atât înainte: clientul a primit confirmarea de curând.
const reamintireDue = (start, creat) => {
  const r1 = Number(setari.reamintire_1_min) * 60000, r2 = Number(setari.reamintire_2_min) * 60000;
  const ramas = start - acum, avans = start - (isNaN(creat) ? 0 : creat);
  if (r2 > 0 && ramas <= r2 && avans > r2) return 'reamintire_2';
  if (r1 > 0 && ramas <= r1 && ramas > r2 && avans > r1) return 'reamintire_1';
  return null;
};

const texte = (tip, d) => {
  const elegant = setari.ton === 'elegant';
  const cu = d.om ? `, cu ${d.om}` : '';
  const cand = oraRo(acum).zi === d.zi ? 'azi' : d.zi;
  const salut = elegant ? (d.client ? `Bună ziua, ${d.client},` : 'Bună ziua,') : (d.prenume ? `Salut, ${d.prenume}!` : 'Salut!');
  const semn = `${d.firma}, ${d.telefon}`;
  const nume = (n) => (n ? n + ', ' : '');
  const mare = (t, n) => (n ? t : t.charAt(0).toUpperCase() + t.slice(1));
  const T = {
    reamintire_1: elegant ? {
      sms: `${nume(d.client)}${mare('aveti programare', d.client)} ${d.zi}, ora ${d.ora}${cu}, la ${d.firma}. Nu puteti veni? ${d.link}`,
      subiect: `Vă reamintim: ${d.zi}, ora ${d.ora}`,
      email: `${salut}\n\nVă reamintim de programarea de ${d.zi}, ora ${d.ora}${cu}, la ${d.firma} (${d.adresa}).\n\nDacă nu mai puteți veni, vă rugăm să o mutați aici: ${d.link}\n\n${semn}`,
    } : {
      sms: `${nume(d.prenume)}${mare('ai programare', d.prenume)} ${d.zi}, ora ${d.ora}${cu}, la ${d.firma}. Nu mai poti veni? Mut-o aici: ${d.link}`,
      subiect: `Te așteptăm ${d.zi}, ora ${d.ora}`,
      email: `${salut}\n\nÎți amintim de programarea de ${d.zi}, ora ${d.ora}${cu}, la ${d.firma} (${d.adresa}).\n\nDacă nu mai poți veni, mut-o aici, ca să dăm ora altcuiva: ${d.link}\n\n${semn}`,
    },
    reamintire_2: elegant ? {
      sms: `${nume(d.client)}${mare('va asteptam', d.client)} ${cand} la ${d.ora} la ${d.firma}, ${d.adresa}.`,
      subiect: `Vă așteptăm ${cand} la ${d.ora}`,
      email: `${salut}\n\nVă așteptăm ${cand} la ${d.ora}${cu}, la ${d.firma} (${d.adresa}).\n\n${semn}`,
    } : {
      sms: `${nume(d.prenume)}${mare('te asteptam', d.prenume)} ${cand} la ${d.ora} la ${d.firma}, ${d.adresa}.`,
      subiect: `Te așteptăm ${cand} la ${d.ora}`,
      email: `${salut}\n\nTe așteptăm ${cand} la ${d.ora}${cu}, la ${d.firma} (${d.adresa}).\n\n${semn}`,
    },
    recenzie: elegant ? {
      sms: `${nume(d.client)}${mare('va multumim pentru vizita la', d.client)} ${d.firma}. O recenzie ne-ar ajuta: ${d.recenzie} (STOP=dezabonare)`,
      subiect: 'Vă mulțumim pentru vizită',
      email: `${salut}\n\nVă mulțumim că ați ales ${d.firma}. Dacă v-a plăcut, o recenzie pe Google ne ajută mult:\n${d.recenzie}\n\n${semn}\n\nNu mai doriți mesaje de la noi? ${d.dezabonare}`,
    } : {
      sms: `${nume(d.prenume)}${mare('multumim ca ai fost la', d.prenume)} ${d.firma}! O recenzie ne-ar ajuta mult: ${d.recenzie} (STOP=dezabonare)`,
      subiect: `Cum a fost la ${d.firma}?`,
      email: `${salut}\n\nMulțumim că ai trecut pe la ${d.firma}. Dacă ți-a plăcut, o recenzie pe Google ne ajută mult. Durează un minut:\n${d.recenzie}\n\n${semn}\n\nNu mai vrei mesaje de la noi? ${d.dezabonare}`,
    },
    recenzie_2: elegant ? {
      sms: `${nume(d.client)}${mare('daca aveti un minut', d.client)}, o recenzie pentru ${d.firma} ne ajuta mult: ${d.recenzie} (STOP=dezabonare)`,
      subiect: `O recenzie pentru ${d.firma}`,
      email: `${salut}\n\nDacă aveți un minut, o recenzie pe Google pentru ${d.firma} ne ajută mult:\n${d.recenzie}\n\nVă mulțumim.\n${semn}\n\nNu mai doriți mesaje de la noi? ${d.dezabonare}`,
    } : {
      sms: `${nume(d.prenume)}${mare('daca ai un minut', d.prenume)}, o recenzie pentru ${d.firma} ne ajuta mult: ${d.recenzie} (STOP=dezabonare)`,
      subiect: `Un minut pentru ${d.firma}?`,
      email: `${salut}\n\nDacă n-ai apucat: o recenzie pe Google pentru ${d.firma} ne ajută mult.\n${d.recenzie}\n\nMulțumim!\n${semn}\n\nNu mai vrei mesaje de la noi? ${d.dezabonare}`,
    },
    mutata: elegant ? {
      sms: `${nume(d.client)}${mare('programarea', d.client)} la ${d.firma} s-a mutat: ${d.zi}, ora ${d.ora}${cu}. Nu va convine? ${d.link}`,
      subiect: `Programarea s-a mutat: ${d.zi}, ora ${d.ora}`,
      email: `${salut}\n\nProgramarea dumneavoastră la ${d.firma} s-a mutat. Ora nouă:\n${d.zi}, ora ${d.ora}${cu}\n${d.adresa}\n\nDacă nu vă convine, puteți alege altă oră: ${d.link}\n\n${semn}`,
    } : {
      sms: `${nume(d.prenume)}${mare('programarea ta', d.prenume)} la ${d.firma} s-a mutat: ${d.zi}, ora ${d.ora}${cu}. Nu-ti convine? ${d.link}`,
      subiect: `Programarea ta s-a mutat: ${d.zi}, ora ${d.ora}`,
      email: `${salut}\n\nProgramarea ta la ${d.firma} s-a mutat. Ora nouă:\n${d.zi}, ora ${d.ora}${cu}\n${d.adresa}\n\nDacă nu-ți convine, alege altă oră: ${d.link}\n\n${semn}`,
    },
  }[tip];
  return { sms: faraDiacritice(T.sms), subiect: T.subiect, email: T.email };
};

const iesire = [];
const adauga = (m) => { if (!deja(m) && !iesire.some((x) => x.eveniment_id === m.eveniment_id && x.ora_programare === m.ora_programare && x.tip === m.tip && x.contact === m.contact)) iesire.push(m); };
// ---------- cererea de recenzie ----------
const MIN = 60000, ZI = 1440 * MIN;
const dupa = Number(setari.recenzie_dupa_min) * MIN;
const fereastra = Math.max(ZI, dupa + ZI / 2); // după atât, cererea nu mai pleacă (e prea târziu)
const aDoua = Number(setari.recenzie_a_doua_zile) * ZI;
const pauza = Number(setari.recenzie_pauza_zile) * ZI;
const simplu = (t) => faraDiacritice(t).toLowerCase().replace(/\s+/g, ' ').trim();
// Patronul marchează în calendar cine n-a venit: cu culoarea din setări sau cu titlul care începe cu „NU A VENIT”.
const nuAVenit = (e) => (setari.neprezentare_culoare && String(e.colorId || '') === String(setari.neprezentare_culoare))
  || (setari.neprezentare_titlu && simplu(e.summary).startsWith(simplu(setari.neprezentare_titlu)));
const aPrimit = (eveniment_id, tip, contact) => jurnal.some((r) => r.eveniment_id === eveniment_id && r.tip === tip && (!r.contact || cheie(r.contact) === cheie(contact)));
// A primit o cerere de recenzie pentru altă programare de curând (recenzie_pauza_zile)?
const inPauza = (e, start, contact) => jurnal.some((r) => (r.tip === 'recenzie' || r.tip === 'recenzie_2') && r.eveniment_id !== e.id
  && r.contact && cheie(r.contact) === cheie(contact) && Math.abs(start - Date.parse(oraIso(r.ora_programare))) < pauza);
const linkDezabonare = (email) => `${setari.link_dezabonare}?c=${Buffer.from(email, 'utf8').toString('base64url')}`;
const recenzieDue = (e, start, sfarsit, contact) => {
  const trecut = acum - sfarsit;
  if (!aPrimit(e.id, 'recenzie', contact)) return trecut >= dupa && trecut <= fereastra && !inPauza(e, start, contact) ? 'recenzie' : null;
  const trecut2 = trecut - aDoua;
  return aDoua > 0 && !aPrimit(e.id, 'recenzie_2', contact) && trecut2 >= dupa && trecut2 <= fereastra ? 'recenzie_2' : null;
};

for (const { json: e } of $input.all()) {
  if (!e || e.status === 'cancelled' || !e.start || !e.start.dateTime) continue; // zi întreagă (concediu, „închis”) sau anulat
  const ora_programare = oraIso(e.start.dateTime);
  const start = Date.parse(ora_programare);
  const sfarsit = e.end && e.end.dateTime ? Date.parse(e.end.dateTime) : start;
  const baza = { eveniment_id: e.id, ora_programare, om: omul(e) };
  if (start <= acum) {
    // după programare: cererea de recenzie
    if (setari.recenzie !== 'da' || sfarsit > acum || nuAVenit(e)) continue;
    const d = { ...desparteTitlul(e.summary), firma: setari.firma_nume, telefon: setari.firma_telefon, recenzie: setari.link_recenzie };
    for (const { canal, contact } of tinte(citesteContact(e.description))) {
      const tip = recenzieDue(e, start, sfarsit, contact);
      if (!tip) continue;
      if (nuTrimite.has(cheie(contact))) { adauga({ ...baza, trimite: false, motiv: 'nu trimite', tip: 'sarit', canal, contact }); continue; }
      const t = texte(tip, { ...d, dezabonare: canal === 'email' ? linkDezabonare(contact) : '' });
      adauga({ ...baza, trimite: true, tip, canal, contact, ...(canal === 'email' ? { subiect: t.subiect, text: t.email } : { text: t.sms }) });
    }
    continue;
  }
  // înainte de programare: reamintirile și anunțul de mutare
  if (setari.reamintiri === 'da') {
    const datorata = reamintireDue(start, Date.parse(e.created));
    const lista = tinte(citesteContact(e.description));
    if (!lista.length) {
      if (datorata) adauga({ ...baza, trimite: false, motiv: 'fara contact', tip: 'sarit', canal: '', contact: '' });
      continue;
    }
    const d = { ...desparteTitlul(e.summary), ...oraRo(ora_programare), om: baza.om, firma: setari.firma_nume, adresa: setari.firma_adresa, telefon: setari.firma_telefon, link: setari.link_programare };
    for (const { canal, contact } of lista) {
      const stiuta = oraStiuta(e.id, contact);
      const tip = stiuta && stiuta !== ora_programare ? 'mutata' : datorata;
      if (!tip) continue;
      if (nuTrimite.has(cheie(contact))) { adauga({ ...baza, trimite: false, motiv: 'nu trimite', tip: 'sarit', canal, contact }); continue; }
      const t = texte(tip, d);
      adauga({ ...baza, trimite: true, tip, canal, contact, ...(canal === 'email' ? { subiect: t.subiect, text: t.email } : { text: t.sms }) });
    }
  }
}
return iesire.map((json) => ({ json }));
