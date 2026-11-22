# Clinică WF1: programarea și reamintirile

**Ce face:** o programare nouă (webhook) se notează în tabel și pleacă un SMS de confirmare. Apoi așteaptă: reamintire cu 48 de ore înainte, alta cu 3 ore înainte, iar după vizită o cerere de recenzie pe Google. Înainte de fiecare SMS verifică în tabel că programarea e încă activă.

**Aplicații (toate pe contul clientului):** Twilio (SMS), Google Sheets.

**De completat:** `CONFIG_SHEET_ID` (tabelul clinicii, cu foile `Config`, `Appointments`, `Message_Log`), `CONFIG_TWILIO_NUMAR` (numărul de trimitere). În foaia `Config`: `clinic_name`, `clinic_phone`, `booking_link`, `google_review_link`.

**Date sensibile:** da, pentru că e o clinică. SMS-urile au doar numele, ziua și ora: niciun tratament. Nu adăuga AI pe datele pacienților fără verificarea cu `legal-advisor-ro`.

**De știut:** nodurile Wait țin execuția deschisă zile întregi. Cum se socotesc la rulările din abonament: de verificat la primul client.
