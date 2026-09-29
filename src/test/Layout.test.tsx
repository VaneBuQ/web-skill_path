/**
 * Navegación principal.
 *
 * El caso que motiva estas pruebas: /quiz existía y funcionaba, pero no estaba
 * en el menú. Solo se llegaba por un atajo del Home, así que navegando por la
 * barra superior el examen parecía no existir.
 */

import { screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Header } from "../components/Layout";
import { AuthProvider } from "../lib/auth";
import { renderWithProviders } from "./helpers";

vi.mock("../lib/api", async () => {
  const actual = await vi.importActual<typeof import("../lib/api")>("../lib/api");
  return { ...actual, api: { me: () => Promise.reject(new Error("sin sesión")) } };
});

/** Las secciones que el usuario debe poder alcanzar desde la barra superior. */
const SECCIONES = [
  ["Explorar", "/explorar"],
  ["Repasar", "/repasar"],
  ["Quiz", "/quiz"],
  ["Mis mazos", "/mis-mazos"],
  ["Mi progreso", "/progreso"],
  ["Configuración", "/configuracion"],
];

function montar() {
  return renderWithProviders(
    <AuthProvider>
      <Header />
    </AuthProvider>,
  );
}

describe("barra de navegación", () => {
  it.each(SECCIONES)("lleva a «%s»", (etiqueta, destino) => {
    montar();
    const barra = screen.getByRole("navigation");
    expect(within(barra).getByRole("link", { name: etiqueta })).toHaveAttribute("href", destino);
  });

  it("el logo vuelve al inicio", () => {
    montar();
    expect(screen.getByRole("link", { name: /SkillPath/ })).toHaveAttribute("href", "/inicio");
  });

  it("ninguna etiqueta se parte en dos renglones", () => {
    montar();
    const barra = screen.getByRole("navigation");
    for (const [etiqueta] of SECCIONES) {
      const enlace = within(barra).getByRole("link", { name: etiqueta });
      expect(enlace.className).toContain("whitespace-nowrap");
    }
  });
});
