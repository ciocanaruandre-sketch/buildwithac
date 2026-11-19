import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// fără `globals`, Testing Library nu curăță singur pagina între teste
afterEach(cleanup);
