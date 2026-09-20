/** Crear mazo — criterios de aceptación de la historia 8. */

import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DeckNew } from "../pages/DeckNew";
import { renderWithProviders } from "./helpers";

const createDeck = vi.fn();
const navigate = vi.fn();

vi.mock("../lib/api", async () => {
  const actual = await vi.importActual<typeof import("../lib/api")>("../lib/api");
  return { ...actual, api: { createDeck: (...args: unknown[]) => createDeck(...args) } };
});

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return { ...actual, useNavigate: () => navigate };
});

beforeEach(() => {
  createDeck.mockReset();
  navigate.mockReset();
  createDeck.mockResolvedValue({
    topicId: "deck_01J9",
    name: "Apuntes de clase",
    description: null,
    cardCount: 1,
    icon: "book-open",
    isOwn: true,
    createdAt: "2026-09-21T10:00:00Z",
  });
});

function guardar() {
  return screen.getByRole("button", { name: "Guardar mazo" });
}

describe("criterio: nombre y al menos una tarjeta", () => {
  it("no se puede guardar un mazo vacío", () => {
    renderWithProviders(<DeckNew />);
    expect(guardar()).toBeDisabled();
  });

  it("con nombre pero sin tarjeta sigue bloqueado", async () => {
    renderWithProviders(<DeckNew />);
    await userEvent.type(screen.getByLabelText("Nombre del mazo"), "Apuntes de clase");
    expect(guardar()).toBeDisabled();
  });

  it("con tarjeta pero sin nombre sigue bloqueado", async () => {
    renderWithProviders(<DeckNew />);
    await userEvent.type(screen.getByLabelText("Pregunta"), "¿Qué es IaC?");
    await userEvent.type(screen.getByLabelText("Respuesta"), "Infraestructura como código.");
    expect(guardar()).toBeDisabled();
  });

  it("una tarjeta a medias no cuenta", async () => {
    renderWithProviders(<DeckNew />);
    await userEvent.type(screen.getByLabelText("Nombre del mazo"), "Apuntes");
    await userEvent.type(screen.getByLabelText("Pregunta"), "¿Qué es IaC?");
    // Falta la respuesta.
    expect(guardar()).toBeDisabled();
    expect(screen.getByText("0 tarjetas listas")).toBeInTheDocument();
  });

  it("con nombre y una tarjeta completa ya se puede guardar", async () => {
    renderWithProviders(<DeckNew />);
    await userEvent.type(screen.getByLabelText("Nombre del mazo"), "Apuntes");
    await userEvent.type(screen.getByLabelText("Pregunta"), "¿Qué es IaC?");
    await userEvent.type(screen.getByLabelText("Respuesta"), "Infraestructura como código.");

    expect(guardar()).toBeEnabled();
    expect(screen.getByText("1 tarjeta lista")).toBeInTheDocument();
  });
});

describe("envío", () => {
  it("manda solo las tarjetas completas, recortadas", async () => {
    renderWithProviders(<DeckNew />);
    await userEvent.type(screen.getByLabelText("Nombre del mazo"), "  Apuntes  ");
    await userEvent.type(screen.getByLabelText("Pregunta"), "¿Qué es IaC?");
    await userEvent.type(screen.getByLabelText("Respuesta"), "Infraestructura como código.");
    await userEvent.type(screen.getByLabelText(/Pista de memoria/), "No es la Parte C.");

    // Una segunda tarjeta vacía no debe viajar.
    await userEvent.click(screen.getByRole("button", { name: /Agregar tarjeta/ }));
    await userEvent.click(guardar());

    expect(createDeck).toHaveBeenCalledWith("Apuntes", null, [
      {
        question: "¿Qué es IaC?",
        answer: "Infraestructura como código.",
        hint: "No es la Parte C.",
      },
    ]);
  });

  it("tras crear el mazo lleva a su detalle", async () => {
    renderWithProviders(<DeckNew />);
    await userEvent.type(screen.getByLabelText("Nombre del mazo"), "Apuntes");
    await userEvent.type(screen.getByLabelText("Pregunta"), "P");
    await userEvent.type(screen.getByLabelText("Respuesta"), "R");
    await userEvent.click(guardar());

    expect(navigate).toHaveBeenCalledWith("/mis-mazos/deck_01J9", { replace: true });
  });

  it("muestra el mensaje del backend si falla", async () => {
    const { ApiError } = await vi.importActual<typeof import("../lib/api")>("../lib/api");
    createDeck.mockRejectedValue(
      new ApiError(400, "VALIDATION_ERROR", "El mazo necesita al menos 1 tarjeta."),
    );

    renderWithProviders(<DeckNew />);
    await userEvent.type(screen.getByLabelText("Nombre del mazo"), "Apuntes");
    await userEvent.type(screen.getByLabelText("Pregunta"), "P");
    await userEvent.type(screen.getByLabelText("Respuesta"), "R");
    await userEvent.click(guardar());

    expect(await screen.findByRole("alert")).toHaveTextContent("al menos 1 tarjeta");
  });
});

describe("tarjetas del formulario", () => {
  it("agregar crea un bloque nuevo", async () => {
    renderWithProviders(<DeckNew />);
    expect(screen.getAllByLabelText("Pregunta")).toHaveLength(1);

    await userEvent.click(screen.getByRole("button", { name: /Agregar tarjeta/ }));
    expect(screen.getAllByLabelText("Pregunta")).toHaveLength(2);
  });

  it("la última tarjeta no se puede quitar", async () => {
    renderWithProviders(<DeckNew />);
    expect(screen.queryByLabelText(/Quitar tarjeta/)).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /Agregar tarjeta/ }));
    expect(screen.getAllByLabelText(/Quitar tarjeta/)).toHaveLength(2);
  });

  it("quitar una tarjeta la elimina del formulario", async () => {
    renderWithProviders(<DeckNew />);
    await userEvent.click(screen.getByRole("button", { name: /Agregar tarjeta/ }));
    await userEvent.click(screen.getByLabelText("Quitar tarjeta 2"));

    expect(screen.getAllByLabelText("Pregunta")).toHaveLength(1);
  });
});
