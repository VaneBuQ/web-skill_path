/**
 * Explorar temas (historia 1).
 *
 * El caso que motiva estas pruebas: con el catálogo sin sembrar, la pantalla
 * decía «No encontramos temas que coincidan con «»» y parecía que la búsqueda
 * estaba rota, cuando lo que faltaba era cargar los datos.
 */

import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Explore } from "../pages/Explore";
import type { Topic } from "../lib/types";
import { renderWithProviders } from "./helpers";

const topics = vi.fn();
const myTopics = vi.fn();
const followTopic = vi.fn();

vi.mock("../lib/api", async () => {
  const actual = await vi.importActual<typeof import("../lib/api")>("../lib/api");
  return {
    ...actual,
    api: {
      topics: (...args: unknown[]) => topics(...args),
      myTopics: (...args: unknown[]) => myTopics(...args),
      followTopic: (...args: unknown[]) => followTopic(...args),
    },
  };
});

const algebra: Topic = {
  topicId: "algebra-lineal",
  name: "Álgebra lineal",
  description: "Matrices, vectores y espacios",
  cardCount: 12,
  icon: "sigma",
  level: "intermedio",
};

beforeEach(() => {
  topics.mockReset();
  myTopics.mockReset();
  followTopic.mockReset();
  myTopics.mockResolvedValue({ items: [] });
});

describe("catálogo vacío", () => {
  it("sin búsqueda dice que el catálogo está vacío, no que no hay coincidencias", async () => {
    topics.mockResolvedValue({ items: [] });
    renderWithProviders(<Explore />);

    expect(await screen.findByText("El catálogo está vacío")).toBeInTheDocument();
    expect(screen.queryByText(/No encontramos temas que coincidan/)).not.toBeInTheDocument();
  });

  it("y ofrece la salida que sí funciona: crear un mazo propio", async () => {
    topics.mockResolvedValue({ items: [] });
    renderWithProviders(<Explore />);

    const enlace = await screen.findByRole("link", { name: /Crear mi primer mazo/ });
    expect(enlace).toHaveAttribute("href", "/mis-mazos/nuevo");
  });

  it("buscando algo que no existe sí dice que no hay coincidencias", async () => {
    topics.mockResolvedValue({ items: [] });
    renderWithProviders(<Explore />);
    await screen.findByText("El catálogo está vacío");

    await userEvent.type(screen.getByLabelText("Buscar temas"), "cuántica");

    expect(await screen.findByText(/No encontramos temas que coincidan con «cuántica»/))
      .toBeInTheDocument();
    // Y deja volver al listado completo sin borrar el texto a mano.
    await userEvent.click(screen.getByRole("button", { name: "Ver todos los temas" }));
    expect(await screen.findByText("El catálogo está vacío")).toBeInTheDocument();
  });
});

describe("el buscador", () => {
  it("la lupa lleva tamaño propio", async () => {
    // El className de los iconos sustituye al de por defecto: sin una clase de
    // tamaño aquí, el SVG se estiraba hasta tapar la pantalla entera.
    topics.mockResolvedValue({ items: [] });
    const { container } = renderWithProviders(<Explore />);
    await screen.findByText("El catálogo está vacío");

    const lupa = container.querySelector("svg");
    expect(lupa?.getAttribute("class")).toMatch(/\bh-\[18px\]/);
    expect(lupa?.getAttribute("class")).toMatch(/\bw-\[18px\]/);
  });
});

describe("catálogo con temas", () => {
  it("muestra cada tema con su número de conceptos", async () => {
    topics.mockResolvedValue({ items: [algebra] });
    renderWithProviders(<Explore />);

    expect(await screen.findByText("Álgebra lineal")).toBeInTheDocument();
    expect(screen.getByText("12 conceptos")).toBeInTheDocument();
  });

  it("agregar un tema confirma cuántos conceptos trae", async () => {
    topics.mockResolvedValue({ items: [algebra] });
    followTopic.mockResolvedValue({
      topicId: "algebra-lineal",
      name: "Álgebra lineal",
      cardCount: 12,
      alreadyFollowing: false,
    });
    renderWithProviders(<Explore />);

    await userEvent.click(await screen.findByRole("button", { name: "Agregar a Mis temas" }));

    expect(followTopic).toHaveBeenCalledWith("algebra-lineal");
    expect(await screen.findByRole("status")).toHaveTextContent(
      "«Álgebra lineal» se agregó con 12 conceptos.",
    );
  });

  it("un tema que ya sigues no se puede agregar dos veces", async () => {
    topics.mockResolvedValue({ items: [algebra] });
    myTopics.mockResolvedValue({ items: [{ topicId: "algebra-lineal" }] });
    renderWithProviders(<Explore />);

    expect(await screen.findByRole("button", { name: "Ya está en Mis temas" })).toBeDisabled();
  });
});
