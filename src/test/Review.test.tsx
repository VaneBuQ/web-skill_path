/**
 * Sesión de repaso — criterios de aceptación de las historias 2 y 3.
 */

import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Review } from "../pages/Review";
import type { AnswerCheck, DueCards, ReviewResult } from "../lib/types";
import { ApiError } from "../lib/api";
import { AI_MAX_ANSWER_WORDS } from "../lib/types";
import { renderWithProviders } from "./helpers";

const dueCards = vi.fn();
const review = vi.fn();
const checkAnswer = vi.fn();

vi.mock("../lib/api", async () => {
  const actual = await vi.importActual<typeof import("../lib/api")>("../lib/api");
  return {
    ...actual,
    api: {
      dueCards: (...args: unknown[]) => dueCards(...args),
      review: (...args: unknown[]) => review(...args),
      checkAnswer: (...args: unknown[]) => checkAnswer(...args),
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
  progress: {
    topicId: "algebra-lineal",
    topicName: "Álgebra lineal",
    cardsTotal: 12,
    cardsMastered: 1,
    cardsPending: 11,
    percent: 8,
    lastStudiedAt: "2026-09-27",
  },
};

const veredicto: AnswerCheck = {
  cardId: "crd_0001",
  topicId: "algebra-lineal",
  yourAnswer: "Es el conjunto de vectores que la matriz manda al cero",
  correctAnswer: "Respuesta 1",
  verdict: "parcial",
  score: 65,
  feedback: "Vas bien: es el conjunto de vectores anulados, pero falta decir que es un subespacio.",
  suggestedRating: "hard",
  checkedAt: "2026-09-27T10:00:00-05:00",
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
  checkAnswer.mockReset();
  review.mockResolvedValue(resultado);
  checkAnswer.mockResolvedValue(veredicto);
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

    expect(screen.getByText("Respuesta correcta:")).toBeInTheDocument();
    expect(screen.getByText("Respuesta 1")).toBeInTheDocument();
    // El concepto sigue a la vista: el usuario compara su respuesta con la correcta.
    expect(screen.getByText("Pregunta 1")).toBeInTheDocument();
  });

  it("muestra la pista de memoria cuando la tarjeta la tiene", async () => {
    dueCards.mockResolvedValue(sesion([{ hint: "determinante ≠ 0" }]));
    montar();
    await userEvent.click(await screen.findByRole("button", { name: "Ver respuesta" }));

    expect(screen.getByText(/determinante ≠ 0/)).toBeInTheDocument();
  });

  it("sin tarjetas pendientes lo dice sin tratarlo como error", async () => {
    // Criterio de la historia 2: es un estado normal, no un error.
    dueCards.mockResolvedValue(sesion([]));
    montar();

    expect(await screen.findByText("No hay tarjetas pendientes por hoy.")).toBeInTheDocument();
    expect(screen.getByText(/Has completado todas las tarjetas de hoy/)).toBeInTheDocument();
  });

  it("el encabezado dice en qué tarjeta va", async () => {
    dueCards.mockResolvedValue(sesion([{}, {}, {}]));
    montar();

    expect(await screen.findByText(/Álgebra lineal · Tarjeta 1 de 3/)).toBeInTheDocument();
  });
});

describe("historia 3 — calificar el repaso", () => {
  it("las tres calificaciones aparecen solo tras ver la respuesta", async () => {
    dueCards.mockResolvedValue(sesion([{}]));
    montar();

    expect(screen.queryByRole("button", { name: "Olvidado" })).not.toBeInTheDocument();
    await userEvent.click(await screen.findByRole("button", { name: "Ver respuesta" }));

    for (const label of ["Olvidado", "A medias", "Dominado"]) {
      expect(screen.getByRole("button", { name: label })).toBeInTheDocument();
    }
  });

  it("calificar envía la calificación y pasa a la siguiente tarjeta", async () => {
    dueCards.mockResolvedValue(sesion([{}, {}]));
    montar();

    await userEvent.click(await screen.findByRole("button", { name: "Ver respuesta" }));
    await userEvent.click(screen.getByRole("button", { name: "Dominado" }));

    expect(review).toHaveBeenCalledWith("crd_0001", "algebra-lineal", "easy");
    // Criterio: «AND se muestra la siguiente tarjeta del mazo».
    expect(await screen.findByText("Pregunta 2")).toBeInTheDocument();
    expect(screen.queryByText("Respuesta 1")).not.toBeInTheDocument();
  });

  it("acumula el XP ganado durante la sesión", async () => {
    dueCards.mockResolvedValue(sesion([{}, {}]));
    montar();

    await userEvent.click(await screen.findByRole("button", { name: "Ver respuesta" }));
    await userEvent.click(screen.getByRole("button", { name: "Dominado" }));

    expect(await screen.findByText("+5 XP")).toBeInTheDocument();
  });

  it("al terminar todas las tarjetas resume la sesión", async () => {
    dueCards.mockResolvedValue(sesion([{}]));
    montar();

    await userEvent.click(await screen.findByRole("button", { name: "Ver respuesta" }));
    await userEvent.click(screen.getByRole("button", { name: "Dominado" }));

    expect(await screen.findByText("¡Sesión completada!")).toBeInTheDocument();
    expect(screen.getByText(/Repasaste 1 concepto/)).toBeInTheDocument();
  });

  it("la calificación que sugiere la IA se resalta, pero decide el usuario", async () => {
    dueCards.mockResolvedValue(sesion([{}]));
    montar();

    await userEvent.type(
      await screen.findByLabelText(/Escribe lo que sabes/),
      "Los vectores que la matriz manda al cero",
    );
    await userEvent.click(screen.getByRole("button", { name: /Comprobar con IA/ }));

    // «A medias» es la sugerencia (suggestedRating: "hard").
    const sugerida = await screen.findByRole("button", { name: "A medias" });
    expect(sugerida.className).toContain("ring-2");
    expect(screen.getByRole("button", { name: "Dominado" }).className).not.toContain("ring-2");

    // Y el usuario puede ignorarla.
    await userEvent.click(screen.getByRole("button", { name: "Dominado" }));
    expect(review).toHaveBeenCalledWith("crd_0001", "algebra-lineal", "easy");
  });
});

describe("cuando el servicio de progreso no responde", () => {
  // El repaso se guarda igual y la API responde progress: null. Sin avisar,
  // el usuario solo ve que su progreso «no sube» y no tiene forma de saberlo.
  const sinProgreso = { ...resultado, progress: null };

  it("avisa de que el progreso no se está guardando", async () => {
    dueCards.mockResolvedValue(sesion([{}, {}]));
    review.mockResolvedValue(sinProgreso);
    montar();

    await userEvent.click(await screen.findByRole("button", { name: "Ver respuesta" }));
    await userEvent.click(screen.getByRole("button", { name: "Dominado" }));

    expect(await screen.findByRole("status")).toHaveTextContent(
      /el progreso del tema no se está actualizando/i,
    );
    expect(screen.getByRole("status")).toHaveTextContent(/Configuración/);
  });

  it("no avisa cuando el progreso sí llega", async () => {
    dueCards.mockResolvedValue(sesion([{}, {}]));
    montar();

    await userEvent.click(await screen.findByRole("button", { name: "Ver respuesta" }));
    await userEvent.click(screen.getByRole("button", { name: "Dominado" }));
    await screen.findByText("Pregunta 2");

    expect(screen.queryByText(/no se está actualizando/i)).not.toBeInTheDocument();
  });

  it("el aviso sigue visible en el resumen final", async () => {
    dueCards.mockResolvedValue(sesion([{}]));
    review.mockResolvedValue(sinProgreso);
    montar();

    await userEvent.click(await screen.findByRole("button", { name: "Ver respuesta" }));
    await userEvent.click(screen.getByRole("button", { name: "Dominado" }));

    expect(await screen.findByText("¡Sesión completada!")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(/no se está actualizando/i);
  });
});

describe("evaluación con IA de la respuesta escrita", () => {
  it("muestra el veredicto, el puntaje y la explicación", async () => {
    dueCards.mockResolvedValue(sesion([{}]));
    montar();

    await userEvent.type(await screen.findByLabelText(/Escribe lo que sabes/), "Mi respuesta");
    await userEvent.click(screen.getByRole("button", { name: /Comprobar con IA/ }));

    // «A medias» sale dos veces: como veredicto y como botón de calificación.
    expect(await screen.findByText("A medias", { selector: "span" })).toBeInTheDocument();
    expect(screen.getByText("65 / 100")).toBeInTheDocument();
    expect(screen.getByText(/falta decir que es un subespacio/)).toBeInTheDocument();
    // Y junto al veredicto, lo que escribió y la respuesta de la tarjeta.
    expect(screen.getByText(veredicto.yourAnswer)).toBeInTheDocument();
    expect(screen.getByText("Respuesta 1")).toBeInTheDocument();
  });

  it("sin escribir nada no se puede comprobar", async () => {
    dueCards.mockResolvedValue(sesion([{}]));
    montar();

    expect(await screen.findByRole("button", { name: /Comprobar con IA/ })).toBeDisabled();
  });

  it("pasado el límite de palabras se bloquea y se avisa", async () => {
    dueCards.mockResolvedValue(sesion([{}]));
    montar();

    const cuadro = await screen.findByLabelText(/Escribe lo que sabes/);
    await userEvent.click(cuadro);
    await userEvent.paste(Array.from({ length: AI_MAX_ANSWER_WORDS + 1 }, () => "palabra").join(" "));

    expect(screen.getByText(`${AI_MAX_ANSWER_WORDS + 1} / ${AI_MAX_ANSWER_WORDS} palabras`))
      .toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Comprobar con IA/ })).toBeDisabled();
    expect(screen.getByRole("alert")).toHaveTextContent(/supera las 60 palabras/);
    expect(checkAnswer).not.toHaveBeenCalled();
  });

  it("si la IA falla, se puede seguir repasando sin ella", async () => {
    dueCards.mockResolvedValue(sesion([{}]));
    checkAnswer.mockRejectedValue(new ApiError(503, "AI_UNAVAILABLE", "La IA no está disponible."));
    montar();

    await userEvent.type(await screen.findByLabelText(/Escribe lo que sabes/), "Mi respuesta");
    await userEvent.click(screen.getByRole("button", { name: /Comprobar con IA/ }));

    expect(await screen.findByRole("alert")).toHaveTextContent("La IA no está disponible.");
    // «Ver respuesta» sigue ahí: la IA es una ayuda, no un requisito.
    await userEvent.click(screen.getByRole("button", { name: "Ver respuesta" }));
    await userEvent.click(screen.getByRole("button", { name: "Dominado" }));
    expect(review).toHaveBeenCalledWith("crd_0001", "algebra-lineal", "easy");
  });
});
