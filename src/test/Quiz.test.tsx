/** Quiz — criterios de aceptación de la historia 6. */

import { act, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Quiz } from "../pages/Quiz";
import type { Quiz as QuizType, QuizResult } from "../lib/types";
import { renderWithProviders } from "./helpers";

const startQuiz = vi.fn();
const submitQuiz = vi.fn();
const topicProgress = vi.fn();

vi.mock("../lib/api", async () => {
  const actual = await vi.importActual<typeof import("../lib/api")>("../lib/api");
  return {
    ...actual,
    api: {
      startQuiz: (...a: unknown[]) => startQuiz(...a),
      submitQuiz: (...a: unknown[]) => submitQuiz(...a),
      topicProgress: (...a: unknown[]) => topicProgress(...a),
    },
  };
});

const quiz: QuizType = {
  quizId: "qz_01J9",
  topicId: "estructuras-de-datos",
  topicName: "Estructuras de Datos",
  questionCount: 2,
  timeLimitSeconds: 360,
  xpReward: 120,
  basedOnConcepts: 24,
  startedAt: "2026-09-21T10:00:00Z",
  questions: [
    {
      questionId: "q1",
      position: 1,
      prompt: "¿Qué estructura de datos sigue el principio LIFO?",
      options: [
        { key: "A", text: "Cola" },
        { key: "B", text: "Pila" },
        { key: "C", text: "Árbol binario" },
        { key: "D", text: "Grafo" },
      ],
    },
    {
      questionId: "q2",
      position: 2,
      prompt: "¿Cuál es la complejidad de búsqueda en un árbol balanceado?",
      options: [
        { key: "A", text: "O(1)" },
        { key: "B", text: "O(n)" },
        { key: "C", text: "O(log n)" },
        { key: "D", text: "O(n²)" },
      ],
    },
  ],
};

const resultado: QuizResult = {
  quizId: "qz_01J9",
  topicId: "estructuras-de-datos",
  topicName: "Estructuras de Datos",
  score: 80,
  correctCount: 8,
  total: 10,
  xpAwarded: 120,
  timedOut: false,
  submittedAt: "2026-09-21T10:06:00Z",
  results: [],
  conceptsToReview: [
    { cardId: "crd_0044", concept: "Complejidad de tablas hash" },
    { cardId: "crd_0052", concept: "Recorrido en profundidad (DFS)" },
  ],
};

function montar() {
  return renderWithProviders(<Quiz />, {
    route: "/quiz/estructuras-de-datos",
    path: "/quiz/:topicId",
  });
}

beforeEach(() => {
  startQuiz.mockReset();
  submitQuiz.mockReset();
  topicProgress.mockReset();
  topicProgress.mockResolvedValue({
    topicId: "estructuras-de-datos",
    topicName: "Estructuras de Datos",
    cardsTotal: 52,
    cardsMastered: 24,
    cardsPending: 28,
    percent: 46,
    lastStudiedAt: "2026-09-21T09:00:00Z",
  });
  startQuiz.mockResolvedValue(quiz);
  submitQuiz.mockResolvedValue(resultado);
});

afterEach(() => {
  vi.useRealTimers();
});

describe("portada", () => {
  it("anuncia las condiciones del quiz", async () => {
    montar();
    expect(await screen.findByText(/Pon a prueba Estructuras de Datos/)).toBeInTheDocument();
    expect(screen.getByText("10 preguntas")).toBeInTheDocument();
    expect(screen.getByText("6 minutos")).toBeInTheDocument();
    expect(screen.getByText("+120 XP al completar")).toBeInTheDocument();
  });
});

describe("bloqueo por conceptos insuficientes", () => {
  it("muestra cuántos lleva y cuántos necesita", async () => {
    const { ApiError } = await vi.importActual<typeof import("../lib/api")>("../lib/api");
    startQuiz.mockRejectedValue(
      new ApiError(409, "NOT_ENOUGH_CONCEPTS", "Necesitas más conceptos.", {
        studied: 7,
        required: 10,
        topicName: "Estructuras de Datos",
      }),
    );

    montar();
    await userEvent.click(await screen.findByRole("button", { name: "Comenzar quiz" }));

    // La pantalla del prototipo (p. 15).
    expect(await screen.findByText("Aún no está listo")).toBeInTheDocument();
    expect(screen.getByText(/Necesitas estudiar al menos 10 conceptos/)).toBeInTheDocument();
    expect(screen.getByText("7")).toBeInTheDocument();
    expect(screen.getByText("Te faltan 3 conceptos.")).toBeInTheDocument();
  });
});

describe("responder", () => {
  async function comenzar() {
    montar();
    await userEvent.click(await screen.findByRole("button", { name: "Comenzar quiz" }));
    await screen.findByText(/Pregunta 1 de 2/);
  }

  it("muestra la primera pregunta con sus cuatro opciones", async () => {
    await comenzar();
    expect(screen.getByText(/principio LIFO/)).toBeInTheDocument();
    for (const texto of ["Cola", "Pila", "Árbol binario", "Grafo"]) {
      expect(screen.getByRole("button", { name: new RegExp(texto) })).toBeInTheDocument();
    }
  });

  it("marca la opción elegida", async () => {
    await comenzar();
    const pila = screen.getByRole("button", { name: /Pila/ });
    await userEvent.click(pila);
    expect(pila).toHaveAttribute("aria-pressed", "true");
  });

  it("lleva la cuenta de respondidas", async () => {
    await comenzar();
    expect(screen.getByText("0 de 2 respondidas")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /Pila/ }));
    expect(screen.getByText("1 de 2 respondidas")).toBeInTheDocument();
  });

  it("avanza y retrocede entre preguntas", async () => {
    await comenzar();
    await userEvent.click(screen.getByRole("button", { name: "Siguiente" }));
    expect(screen.getByText(/árbol balanceado/)).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Anterior" }));
    expect(screen.getByText(/principio LIFO/)).toBeInTheDocument();
  });

  it("envía las respuestas, y las no contestadas van en null", async () => {
    await comenzar();
    await userEvent.click(screen.getByRole("button", { name: /Pila/ }));
    await userEvent.click(screen.getByRole("button", { name: "Siguiente" }));
    await userEvent.click(screen.getByRole("button", { name: "Terminar quiz" }));

    expect(submitQuiz).toHaveBeenCalledWith(
      "qz_01J9",
      [
        { questionId: "q1", selected: "B" },
        { questionId: "q2", selected: null },
      ],
      expect.any(Number),
    );
  });

  it("el cronómetro arranca en el límite y baja", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    montar();
    await userEvent.click(await screen.findByRole("button", { name: "Comenzar quiz" }));
    await screen.findByRole("timer");
    expect(screen.getByRole("timer")).toHaveTextContent("06:00");

    // Cada tick reprograma el siguiente al volver a renderizar, así que hay
    // que avanzar de segundo en segundo y dejar que React procese cada uno.
    for (let i = 0; i < 3; i += 1) {
      await act(async () => {
        vi.advanceTimersByTime(1000);
      });
    }
    await waitFor(() => expect(screen.getByRole("timer")).toHaveTextContent("05:57"));
  });

  it("al agotarse el tiempo el quiz se autoenvía", async () => {
    // Decisión de diseño: autoenviar en vez de invalidar el intento.
    vi.useFakeTimers({ shouldAdvanceTime: true });
    montar();
    await userEvent.click(await screen.findByRole("button", { name: "Comenzar quiz" }));
    await screen.findByRole("timer");

    for (let i = 0; i < 360; i += 1) {
      await act(async () => {
        vi.advanceTimersByTime(1000);
      });
    }

    await waitFor(() => expect(submitQuiz).toHaveBeenCalledTimes(1));
  });
});

describe("resultado", () => {
  async function terminar() {
    montar();
    await userEvent.click(await screen.findByRole("button", { name: "Comenzar quiz" }));
    await screen.findByText(/Pregunta 1 de 2/);
    await userEvent.click(screen.getByRole("button", { name: "Siguiente" }));
    await userEvent.click(screen.getByRole("button", { name: "Terminar quiz" }));
  }

  it("muestra el puntaje y el XP", async () => {
    await terminar();
    expect(await screen.findByText("8/10")).toBeInTheDocument();
    expect(screen.getByText("¡Muy buen trabajo!")).toBeInTheDocument();
    expect(screen.getByText(/\+120 XP obtenidos/)).toBeInTheDocument();
  });

  it("lista los conceptos fallados", async () => {
    await terminar();
    expect(await screen.findByText("Conceptos para repasar")).toBeInTheDocument();
    expect(screen.getByText("Complejidad de tablas hash")).toBeInTheDocument();
    expect(screen.getByText("Recorrido en profundidad (DFS)")).toBeInTheDocument();
  });

  it("«Repasar errores» lleva a una sesión con solo esas tarjetas", async () => {
    await terminar();
    const enlace = await screen.findByRole("link", { name: "Repasar errores" });
    expect(enlace).toHaveAttribute(
      "href",
      "/repasar/estructuras-de-datos?cardIds=crd_0044,crd_0052",
    );
  });
});
