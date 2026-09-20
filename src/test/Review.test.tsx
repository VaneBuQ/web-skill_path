/**
 * Sesión de repaso — criterios de aceptación de las historias 2 y 3.
 */

import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Review } from "../pages/Review";
import type { DueCards, ReviewResult } from "../lib/types";
import { renderWithProviders } from "./helpers";

const dueCards = vi.fn();
const review = vi.fn();

vi.mock("../lib/api", async () => {
  const actual = await vi.importActual<typeof import("../lib/api")>("../lib/api");
  return {
    ...actual,
    api: {
      dueCards: (...args: unknown[]) => dueCards(...args),
      review: (...args: unknown[]) => review(...args),
    },
  };
});

function sesion(items: Partial<DueCards["items"][number]>[]): DueCards {
  return {
    topicId: "algebra-lineal",
    topicName: "Álgebra lineal",
    dueCount: items.length,
    cardsTotal: 12,
    cardsMastered: 0,
    xpAvailable: items.length * 5,
    items: items.map((card, i) => ({
      cardId: `crd_000${i + 1}`,
      question: `Pregunta ${i + 1}`,
      answer: `Respuesta ${i + 1}`,
      hint: null,
      position: i + 1,
      state: "new",
      ...card,
    })) as DueCards["items"],
  };
}

const resultado: ReviewResult = {
  cardId: "crd_0001",
  topicId: "algebra-lineal",
  rating: "easy",
  repetitions: 1,
  easeFactor: 2.6,
  intervalDays: 1,
  nextReviewDate: "2026-09-22",
  state: "learning",
  xpAwarded: 5,
  remainingDue: 1,
  progress: null,
};

function montar() {
  return renderWithProviders(<Review />, {
    route: "/repasar/algebra-lineal",
    path: "/repasar/:topicId",
  });
}

beforeEach(() => {
  dueCards.mockReset();
  review.mockReset();
  review.mockResolvedValue(resultado);
});

describe("historia 2 — estudiar tarjetas", () => {
  it("muestra la pregunta y esconde la respuesta", async () => {
    dueCards.mockResolvedValue(sesion([{}, {}]));
    montar();

    expect(await screen.findByText("Pregunta 1")).toBeInTheDocument();
    expect(screen.queryByText("Respuesta 1")).not.toBeInTheDocument();
  });

  it("al presionar «Ver respuesta» aparece el reverso", async () => {
    dueCards.mockResolvedValue(sesion([{}]));
    montar();
    await userEvent.click(await screen.findByRole("button", { name: "Ver respuesta" }));

    expect(screen.getByText("Respuesta 1")).toBeInTheDocument();
    expect(screen.queryByText("Pregunta 1")).not.toBeInTheDocument();
  });

  it("muestra la pista de memoria cuando la tarjeta la tiene", async () => {
    dueCards.mockResolvedValue(sesion([{ hint: "determinante ≠ 0" }]));
    montar();
    await userEvent.click(await screen.findByRole("button", { name: "Ver respuesta" }));

    expect(screen.getByText(/determinante ≠ 0/)).toBeInTheDocument();
  });

  it("sin tarjetas pendientes muestra «¡Todo al día!»", async () => {
    // Criterio de la historia 2: es un estado normal, no un error.
    dueCards.mockResolvedValue(sesion([]));
    montar();

    expect(await screen.findByText("¡Todo al día!")).toBeInTheDocument();
    expect(screen.getByText(/Vuelve mañana/)).toBeInTheDocument();
  });

  it("el encabezado dice en qué tarjeta va", async () => {
    dueCards.mockResolvedValue(sesion([{}, {}, {}]));
    montar();

    expect(await screen.findByText(/Álgebra lineal · 1 de 3/)).toBeInTheDocument();
  });
});

describe("historia 3 — calificar el repaso", () => {
  it("las tres calificaciones aparecen solo tras ver la respuesta", async () => {
    dueCards.mockResolvedValue(sesion([{}]));
    montar();

    expect(screen.queryByRole("button", { name: "Olvidé" })).not.toBeInTheDocument();
    await userEvent.click(await screen.findByRole("button", { name: "Ver respuesta" }));

    for (const label of ["Olvidé", "Difícil", "Fácil"]) {
      expect(screen.getByRole("button", { name: label })).toBeInTheDocument();
    }
  });

  it("calificar envía la calificación y pasa a la siguiente tarjeta", async () => {
    dueCards.mockResolvedValue(sesion([{}, {}]));
    montar();

    await userEvent.click(await screen.findByRole("button", { name: "Ver respuesta" }));
    await userEvent.click(screen.getByRole("button", { name: "Fácil" }));

    expect(review).toHaveBeenCalledWith("crd_0001", "algebra-lineal", "easy");
    // Criterio: «AND se muestra la siguiente tarjeta del mazo».
    expect(await screen.findByText("Pregunta 2")).toBeInTheDocument();
    expect(screen.queryByText("Respuesta 1")).not.toBeInTheDocument();
  });

  it("acumula el XP ganado durante la sesión", async () => {
    dueCards.mockResolvedValue(sesion([{}, {}]));
    montar();

    await userEvent.click(await screen.findByRole("button", { name: "Ver respuesta" }));
    await userEvent.click(screen.getByRole("button", { name: "Fácil" }));

    expect(await screen.findByText("+5 XP")).toBeInTheDocument();
  });

  it("al terminar todas las tarjetas resume la sesión", async () => {
    dueCards.mockResolvedValue(sesion([{}]));
    montar();

    await userEvent.click(await screen.findByRole("button", { name: "Ver respuesta" }));
    await userEvent.click(screen.getByRole("button", { name: "Fácil" }));

    expect(await screen.findByText("¡Sesión completada!")).toBeInTheDocument();
    expect(screen.getByText(/Repasaste 1 concepto/)).toBeInTheDocument();
  });

  it("el espacio voltea la tarjeta", async () => {
    dueCards.mockResolvedValue(sesion([{}]));
    montar();
    await screen.findByText("Pregunta 1");

    await userEvent.keyboard(" ");
    await waitFor(() => expect(screen.getByText("Respuesta 1")).toBeInTheDocument());
  });
});
