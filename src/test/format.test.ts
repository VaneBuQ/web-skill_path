/** Formateo de fechas, números y reloj. */

import { afterEach, describe, expect, it, vi } from "vitest";
import { formatClock, formatDate, formatNumber, formatRelativeDate, initialsOf } from "../lib/format";

afterEach(() => {
  vi.useRealTimers();
});

describe("fechas", () => {
  it("usa el formato del prototipo", () => {
    expect(formatDate("2026-09-12T18:20:00Z")).toBe("12 sep 2026");
  });

  it("tolera una fecha ausente o inválida", () => {
    expect(formatDate(null)).toBe("—");
    expect(formatDate("no-es-una-fecha")).toBe("—");
  });

  it("dice «Hoy» cuando corresponde", () => {
    vi.setSystemTime(new Date(2026, 8, 21, 10, 0));
    expect(formatRelativeDate(new Date(2026, 8, 21, 8, 0).toISOString())).toBe("Hoy");
  });

  it("dice «Ayer» cuando corresponde", () => {
    vi.setSystemTime(new Date(2026, 8, 21, 10, 0));
    expect(formatRelativeDate(new Date(2026, 8, 20, 23, 0).toISOString())).toBe("Ayer");
  });

  it("más atrás usa la fecha completa", () => {
    vi.setSystemTime(new Date(2026, 8, 21, 10, 0));
    expect(formatRelativeDate(new Date(2026, 8, 12, 10, 0).toISOString())).toBe("12 sep 2026");
  });

  it("sin repasos dice «Nunca»", () => {
    expect(formatRelativeDate(null)).toBe("Nunca");
  });
});

describe("números", () => {
  it("separa los miles como el prototipo", () => {
    expect(formatNumber(2480)).toBe("2,480");
  });

  it("formatea el reloj del quiz", () => {
    expect(formatClock(360)).toBe("06:00");
    expect(formatClock(134)).toBe("02:14");
    expect(formatClock(0)).toBe("00:00");
  });

  it("un reloj en negativo no muestra basura", () => {
    expect(formatClock(-5)).toBe("00:00");
  });
});

describe("iniciales", () => {
  it.each([
    ["Lucía Mendoza", "LM"],
    ["Débora Elsa Jerónimo Balcázar", "DB"],
    ["Ana", "AN"],
    ["  Grace   Moscosso  ", "GM"],
  ])("%s → %s", (nombre, esperado) => {
    expect(initialsOf(nombre)).toBe(esperado);
  });
});
