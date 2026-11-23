# Jurnal: Conu' Leonida (demonstrație)

Un rând pe lucru: ce s-a decis, livrat sau cerut. Cel mai nou sus.

2026-11-23 — documentația n8n, verificată înainte de construcție ([Understand executions](https://docs.n8n.io/build/understand-workflows/understand-executions.md)):
- **Sub-fluxurile nu consumă rulări:** „When a workflow calls another workflow with the Execute Sub-workflow node, only the parent (top-level) execution counts.” Deci `setari-firma` rămâne un sub-flux chemat din fiecare model.
- **Declanșatoarele care verifică periodic (polling) consumă o rulare doar când găsesc ceva nou:** „Polls that return no results don't count as an execution.” Exemplul din documentație e Google Drive Trigger; regula e pentru toate, deci și pentru Google Calendar Trigger.
- **Fluxul de erori nu consumă rulări:** „Error workflow executions: Runs of a workflow set as an error workflow.”
- **`$now` în nodul Code:** documentația îl arată doar în expresii; în nodul Code recomandă `DateTime.now()` (Luxon). Se confirmă la prima rulare de probă (Task 2); codul folosește doar `$now.toMillis()`, care merge la fel și cu `DateTime.now()`.

2026-11-23 — client de demonstrație: automatizările de vânzare (planul 17)
