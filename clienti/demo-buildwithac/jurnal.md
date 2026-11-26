# Jurnal: Conu' Leonida (demonstrație)

Un rând pe lucru: ce s-a decis, livrat sau cerut. Cel mai nou sus.

2026-11-26 — textele reamintirilor aprobate de Andrei (confirmare, reamintire cu o zi și cu 2 ore înainte, mutare; SMS și e-mail). Decizia lui: **fără adresă în SMS-ul de confirmare și în prima reamintire**, ca fiecare să fie un singur SMS (adresa rămâne pe e-mail și în reamintirea de 2 ore). Un test păzește limita de 160 de caractere cu datele demo, în ambele tonuri.

2026-11-26 — conturile demo gata: două calendare („Conu' Leonida – Vlad”, „– Radu”) și tabelul „Conu' Leonida – demo” (foile Jurnal, Nu trimite, Cereri) pe contul Google buildwithac.ai@gmail.com (owner-ul probei). În n8n, owner-ul a făcut cele 3 conexiuni (Google Calendar, Google Sheets, Gmail) și le-a dat Member-ului din fereastra conexiunii → tab-ul **Sharing** → utilizatorul → **Save**. Member-ul le vede cu dreptul „connect” (le folosește, nu le citește). Pe probă merge; pe Starter rămâne de confirmat la primul client (proba poate avea funcții peste Starter).

2026-11-26 — contul de probă n8n Cloud mai are 11 zile (până pe ~2026-12-07): rămânem pe el.

2026-11-23 — documentația n8n, verificată înainte de construcție ([Understand executions](https://docs.n8n.io/build/understand-workflows/understand-executions.md)):
- **Sub-fluxurile nu consumă rulări:** „When a workflow calls another workflow with the Execute Sub-workflow node, only the parent (top-level) execution counts.” Deci `setari-firma` rămâne un sub-flux chemat din fiecare model.
- **Declanșatoarele care verifică periodic (polling) consumă o rulare doar când găsesc ceva nou:** „Polls that return no results don't count as an execution.” Exemplul din documentație e Google Drive Trigger; regula e pentru toate, deci și pentru Google Calendar Trigger.
- **Fluxul de erori nu consumă rulări:** „Error workflow executions: Runs of a workflow set as an error workflow.”
- **`$now` în nodul Code:** documentația îl arată doar în expresii; în nodul Code recomandă `DateTime.now()` (Luxon). Se confirmă la prima rulare de probă (Task 2); codul folosește doar `$now.toMillis()`, care merge la fel și cu `DateTime.now()`.

2026-11-23 — client de demonstrație: automatizările de vânzare (planul 17)
