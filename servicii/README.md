# Serviciile pentru clienți

Tot ce fac pentru clienți se lucrează din acest proiect. Fiecare serviciu are dosarul lui aici, cu regulile, uneltele și pașii.

| Serviciul | Stadiul | Unde |
|---|---|---|
| Site-uri | gata | `site-uri/` |
| Automatizări | urmează (proiectul 2, cu brainstormingul lui) | — |
| Sesiuni 1 la 1 și ghiduri personalizate | urmează (proiectul 3, cu brainstormingul lui) | — |

## Scheletul comun

- `servicii/<serviciu>/`: cum se face serviciul (regulile, șabloanele, listele de pași). E la fel pentru orice client.
- `clienti/<slug>/<serviciu>/`: ce e al unui client anume. Fișa și jurnalul stau o singură dată, în `clienti/<slug>/`, comune tuturor serviciilor lui.

Regulile dosarului de clienți (ce intră în git, ce nu, datele personale) sunt în `clienti/README.md`.

## De unde pornești

Un client nou începe **mereu** cu skill-ul `client-nou`. El face dosarul și fișa, apoi te trimite mai departe la skill-ul serviciului (la site-uri: `site-client`; la predarea unui site: `predare-site`).
