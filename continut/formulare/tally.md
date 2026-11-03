# Formularele Tally pentru clienți

Trei formulare, unul pentru fiecare serviciu. Andrei trimite link-ul potrivit după ce clientul a zis „da”.
Fiecare are 4 părți: **Despre tine** și **Afacerea ta** (la fel în toate 3), apoi **partea serviciului**, apoi **Cum lucrăm** (la fel în toate 3).
Scrisă de Claude pe 2026-11-02. Andrei: „întrebările sunt bune” (aprobate), apoi a corectat formulările pe 2026-11-02 (titlu cu „fac”, nu „facem”: e singur, nu vrea să pară echipă). Previzualizarea: `prototip/formulare.html`.

Notația: `*` = obligatoriu. Între paranteze drepte e tipul câmpului din Tally.

---

## Coperta și începutul (decis de Andrei pe 2026-11-02)

**Coperta:** aurora din culorile logoului (varianta B din `prototip/formulare.html`), **fără niciun text**. Aceeași imagine la toate 3.
**Logoul:** mic, la stânga coloanei, pe jumătate peste marginea de jos a copertei (ca în `Exemple/Screenshot 2026-11-02 114629.png`).
Sub logo: titlul, apoi descrierea (3 paragrafe; ce e între `**` e îngroșat).

**Site**: „Hai să-ți fac site-ul”
> Înainte să ne apucăm de site, **vreau să înțeleg afacerea ta cât mai bine.**
> Întrebările sunt despre ce faci, cui vinzi și ce trebuie să facă site-ul pentru tine. Din răspunsuri îmi dau seama ce pagini îți trebuie, ce texte și ce poze, și cum ar trebui să arate ca să semene cu afacerea ta.
> Durează cam 10 minute și nu există răspunsuri greșite. Dacă nu știi ceva, sari peste întrebare sau scrie „nu știu”. Lămurim împreună la telefon.

**Automatizări**: „Hai să-ți automatizez munca”
> Înainte să automatizez ceva, **vreau să văd exact cum lucrezi acum.**
> Întrebările sunt despre treaba care îți mănâncă timpul: ce faci, pas cu pas, în ce aplicații și cât de des. Din răspunsuri îmi dau seama ce poate merge singur, ce rămâne la tine și ce unelte se potrivesc.
> Durează cam 10 minute și nu există răspunsuri greșite. Dacă nu știi ceva, sari peste întrebare sau scrie „nu știu”. Lămurim împreună la telefon.

**Ghid personalizat**: „Hai să-ți fac ghidul”
> Înainte să-ți fac ghidul, **vreau să știu unde ești acum cu AI-ul și ce vrei să facă pentru tine.**
> Întrebările sunt despre afacerea ta, uneltele pe care le folosești și felul în care înveți. Din răspunsuri îți fac un ghid pe firma ta: pașii, exemplele și tutorialele de care ai nevoie.
> Durează cam 10 minute și nu există răspunsuri greșite. Dacă nu știi ceva, sari peste întrebare sau scrie „nu știu”. Lămurim împreună la telefon.

**În Tally:** un singur font (Inter); culori: fundal `#0b0908`, text `#f6efe3`, buton `#f26a21` cu text `#0b0908`, accent `#ffb52e`.

---

## Partea 1. Despre tine (la fel în toate 3)

1. **Numele tău** `*` [text scurt]
2. **Numele afacerii** `*` [text scurt]
3. **E-mail** `*` [e-mail]
   Ajutor: „Aici îți trimit ce lucrăm.”
4. **Telefon** `*` [telefon]
5. **Cum preferi să vorbim?** `*` [o singură alegere]
   WhatsApp · Telefon · E-mail

---

## Partea 2. Afacerea ta (la fel în toate 3)

6. **Ce faci, pe scurt?** `*` [text lung]
   Ajutor: „Ce vinzi și cui te adresezi?”
7. **De când există afacerea?** [o singură alegere]
   Abia încep · Sub 1 an · 1–3 ani · Peste 3 ani
8. **De unde vin clienții acum?** [mai multe alegeri]
   Recomandări · Instagram · TikTok · Facebook · Google sau Google Maps · Site-ul meu · Trec pe lângă local · Altceva
9. **De ce te aleg clienții pe tine și nu pe alții?** [text lung]
   Ajutor: „Ce ai în plus față de alții sau cum te evidențiezi?”

---

## Partea 3a. Site

10. **Ai deja un site?** `*` [o singură alegere]
    Nu · Da, și vreau să-l refac · Da, și vreau unul nou de la zero
    → dacă „Da”: **Link-ul site-ului actual** [link]
11. **Ai un domeniu?** [o singură alegere]
    Ajutor: „Domeniul e adresa site-ului, de exemplu cafeneauamea.ro.”
    Da · Nu · Nu știu
    → dacă „Da”: **Care e?** [text scurt]
12. **Ce acțiune vrei să facă un client pe site-ul tău?** `*` [o singură alegere]
    Să mă sune sau să-mi scrie oamenii · Să-și facă programări · Să cumpere online · Să vadă meniul sau prețurile · Să-mi vadă lucrările · Altceva
13. **Ce pagini crezi că-ți trebuie?** [mai multe alegeri]
    Acasă · Despre mine / noi · Servicii, meniu sau prețuri · Galerie sau lucrări · Recenzii · Contact · Programări · Nu știu, mă ajuți tu
14. **2–3 site-uri care îți plac și ce-ți place la ele** [text lung]
    Ajutor: „Pot fi din orice domeniu, nu doar al tău. Pune link-ul și o frază.”
15. **Ce n-ai vrea să vezi pe site-ul tău?** [text lung]
    Ajutor: „Culori, stiluri, lucruri care te enervează pe alte site-uri.”
16. **Ai un logo?** [o singură alegere]
    Da · Am, dar nu-mi place · Nu
    → dacă „Da”: **Încarcă logoul** [fișier]
17. **Ai culori sau fonturi pe care le folosești deja?** [text scurt]
    Ajutor: „Pe firmă, pe meniu, pe Instagram. Dacă nu, scrie «nu».”
18. **Cine scrie textele de pe site?** [o singură alegere]
    Le am deja · Le scriem împreună · Scrie-le tu, eu le verific
19. **Ai poze bune cu afacerea ta?** [o singură alegere]
    Da, multe · Câteva · Nu prea
    → dacă nu „Nu prea”: **Încarcă 3–5 poze** [fișier, max. 10 MB fiecare]
20. **Ce o să mai trebuiască schimbat sau actualizat pe site?** [mai multe alegeri]
    Prețurile · Meniul sau serviciile · Programul · Pozele · Nu știu încă

---

## Partea 3b. Automatizări

10. **Ce treabă repetitivă îți ia cel mai mult timp?** `*` [text lung]
    Ajutor: „Descrie-o pas cu pas, ca și cum i-ai explica unui angajat nou. De exemplu: «primesc comanda pe WhatsApp, o trec în Excel, apoi trimit factura pe mail».”
11. **Cât de des o faci?** [o singură alegere]
    De mai multe ori pe zi · O dată pe zi · Săptămânal · Lunar
12. **Cât timp îți ia aproximativ pe săptămână?** [o singură alegere]
    Sub 1 oră · 1–3 ore · 3–10 ore · Peste 10 ore
13. **Ce aplicații folosești deja?** [mai multe alegeri]
    WhatsApp sau WhatsApp Business · Gmail · Outlook · Google Sheets · Excel · Google Calendar · Instagram sau Facebook · Un program de facturare · Un program de programări · Altceva
    → dacă „Un program de facturare”, „Un program de programări” sau „Altceva”: **Care anume?** [text scurt]
14. **Unde ții acum clienții și comenzile?** [o singură alegere]
    Într-un tabel · Într-un program · În caiet · În telefon · Peste tot, un pic
15. **Ce n-ar trebui să se întâmple niciodată?** [text lung]
    Ajutor: „De exemplu: să plece un preț greșit la un client, să se șteargă o programare.”
16. **Lucrezi cu date sensibile?** [o singură alegere]
    Ajutor: „Date medicale, CNP-uri, contracte, date bancare. Contează la ce unelte alegem.”
    Da · Nu · Nu sunt sigur
17. **Cine o să folosească automatizarea?** [o singură alegere]
    Doar eu · Eu și 1–3 colegi · O echipă mai mare
18. **Anumite aplicații necesită abonament lunar, ești ok cu acest lucru?** [o singură alegere]
    Da, unul mic · Contează rezultatul, nu costul
    (Andrei a scos „Prefer doar unelte gratuite”: aproape nu există, n8n oricum costă.)
19. **Un exemplu din treaba asta** [fișier]
    Ajutor: „O captură, un tabel, un e-mail tipic. Fără parole și fără date reale ale clienților.”

---

## Partea 3c. Ghid personalizat

10. **Unde ești acum cu AI-ul?** `*` [o singură alegere]
    Nu l-am folosit · L-am încercat de câteva ori · Îl folosesc des
11. **Ce unelte AI ai folosit?** [mai multe alegeri]
    ChatGPT · Claude · Gemini · Copilot · Niciuna · Altele
    → dacă nu „Niciuna”: **Plătești vreun abonament?** [o singură alegere] Da · Nu
12. **Ce vrei să facă AI-ul pentru tine?** `*` [text lung]
    Ajutor: „2–3 treburi. Pentru cea mai importantă, dă-mi un exemplu concret: «să răspundă la mesajele de pe Instagram cu prețurile», nu «să mă ajute la marketing».”
13. **Cine o să-l folosească?** [o singură alegere]
    Doar eu · Eu și echipa
    → dacă „Eu și echipa”: **Câți sunteți și cât de bine se descurcă la calculator?** [text scurt]
14. **Pe ce lucrați mai mult?** [o singură alegere]
    Telefon · Calculator · Amândouă
15. **Lucrezi cu date pe care n-ai vrea să le pui pe internet?** [o singură alegere]
    Ajutor: „Date de pacienți, CNP-uri, contracte, date bancare. Îți arăt ce să NU pui în AI.”
    Da · Nu · Nu sunt sigur
16. **Cum înveți cel mai ușor?** [o singură alegere]
    Citesc pașii · Mă uit la un video · Îmi arată cineva live
17. **Cum ai vrea să te ajut la început?** [o singură alegere]
    O sesiune live, apoi mă descurc cu ghidul · Câteva sesiuni scurte în primele săptămâni · Doar ghidul scris
    ⚠ Variantele trebuie să fie exact ce oferă Andrei în pachet (riscul: să pară suport nelimitat).
18. **Un exemplu din munca ta** [fișier]
    Ajutor: „Un document, un e-mail sau un tabel pe care vrei să-l faci cu AI. Fără date reale ale clienților.”

---

## Partea 4. Cum lucrăm (la fel în toate 3)

21. **Ce rezultate vrei să ai în 3 luni?** `*` [text lung]
    Ajutor: „Un rezultat concret. De exemplu: «să nu mai răspund eu la aceleași 10 întrebări pe zi».”
22. **În cât timp ai vrea site-ul livrat?** (la celelalte: „automatizarea livrată”, „ghidul livrat”) [o singură alegere]
    Cât mai repede · În luna asta · Nu mă grăbesc · Am o dată fixă
    → dacă „Am o dată fixă”: **Ce dată și de ce?** [text scurt]
23. **Cât de implicat vrei să fii?** [o singură alegere]
    Vreau să văd și să aprob fiecare pas · Îmi arăți direcția, aprob la final · Mână liberă
24. **Mai e ceva ce ar trebui să știu?** [text lung]

**Lângă buton, scris mic:**
> Răspunsurile ajung doar la mine și le folosesc doar pentru proiectul tău. Detalii: buildwithac.ro/confidentialitate

**Butonul:** „Trimite”

---

## Pagina de după trimitere

> **Gata, am primit. Mersi!**
> Mă uit peste răspunsuri și te contactez în 1–2 zile, cum ai ales mai sus, ca să stabilim primul telefon.

---

## În Tally (publicate pe 2026-11-02, plan gratuit)

Site `tally.so/forms/Qo1xzg` · Automatizări `tally.so/forms/M1X8qg` (secțiunea „Treaba de automatizat”) · Ghid `tally.so/forms/jeZGX9` (secțiunea „Tu și AI-ul”). Link-urile pentru clienți: `tally.so/r/Qo1xzg`, `tally.so/r/M1X8qg`, `tally.so/r/jeZGX9`.

## De făcut înainte de folosire


- Pagina de confidențialitate: se adaugă formularele Tally (ce date, de ce, cât se păstrează, Tally la „Cine mai vede datele”).
- Partea 3c, întrebarea 17: variantele trebuie aliniate cu ce include pachetul „Ghid personalizat”.
- În Tally: limba română, Unbounded + Inter, culorile din `CLAUDE.md`, logoul și coperta.
