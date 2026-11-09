import { existsSync } from "node:fs";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");
if (process.env.CRM_MEDIU !== "test") throw new Error("Testele de permisiuni rulează doar pe proiectul de test (CRM_MEDIU=test).");
