/** Cliente de API: cómo traduce respuestas y errores del backend. */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError, api, setAuthToken } from "../lib/api";

function responder(status: number, body: unknown, ok = status < 400) {
  return Promise.resolve({
    ok,
    status,
    text: () => Promise.resolve(body === undefined ? "" : JSON.stringify(body)),
  } as Response);
}

const fetchMock = vi.fn();

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockReset();
  setAuthToken(null);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function ultimaLlamada() {
  const [url, init] = fetchMock.mock.calls.at(-1)!;
  return { url: String(url), init: init as RequestInit };
}

describe("autenticación", () => {
  it("no envía el header Authorization en las rutas públicas", async () => {
    fetchMock.mockReturnValue(responder(200, { items: [] }));
    setAuthToken("un-token");
    await api.topics();

    const headers = ultimaLlamada().init.headers as Record<string, string>;
    expect(headers.Authorization).toBeUndefined();
  });

  it("envía el token en las rutas protegidas", async () => {
    fetchMock.mockReturnValue(responder(200, { items: [] }));
    setAuthToken("un-token");
    await api.myTopics();

    const headers = ultimaLlamada().init.headers as Record<string, string>;
    expect(headers.Authorization).toBe("Bearer un-token");
  });

  it("sin token, una ruta protegida sale sin el header", async () => {
    fetchMock.mockReturnValue(responder(200, { items: [] }));
    await api.myTopics();

    const headers = ultimaLlamada().init.headers as Record<string, string>;
    expect(headers.Authorization).toBeUndefined();
  });
});

describe("errores", () => {
  it("convierte el envelope del backend en un ApiError", async () => {
    fetchMock.mockReturnValue(
      responder(409, {
        error: {
          code: "NOT_ENOUGH_CONCEPTS",
          message: "Necesitas estudiar al menos 10 conceptos. Llevas 7 en Estructuras de Datos.",
          details: { studied: 7, required: 10, topicName: "Estructuras de Datos" },
        },
      }),
    );

    const error = await api.startQuiz("estructuras-de-datos").catch((e) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error.code).toBe("NOT_ENOUGH_CONCEPTS");
    expect(error.status).toBe(409);
    // El mensaje viene listo para mostrarse: las pantallas no traducen códigos.
    expect(error.message).toContain("Llevas 7");
    expect(error.details).toEqual({
      studied: 7,
      required: 10,
      topicName: "Estructuras de Datos",
    });
  });

  it("marca los 401 para que la app cierre la sesión", async () => {
    fetchMock.mockReturnValue(
      responder(401, { error: { code: "UNAUTHENTICATED", message: "Necesitas iniciar sesión." } }),
    );
    const error = await api.me().catch((e) => e);
    expect(error.isUnauthenticated).toBe(true);
  });

  it("un fallo de red no rompe la app", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));
    const error = await api.progress().catch((e) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error.code).toBe("NETWORK_ERROR");
    expect(error.message).toContain("conectar");
  });

  it("un error sin cuerpo JSON tampoco rompe la app", async () => {
    fetchMock.mockReturnValue(responder(502, undefined, false));
    const error = await api.progress().catch((e) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(502);
  });
});

describe("peticiones", () => {
  it("un 204 no intenta parsear cuerpo", async () => {
    fetchMock.mockReturnValue(responder(204, undefined));
    await expect(api.deleteDeck("deck_1")).resolves.toBeUndefined();
  });

  it("manda topicId en el cuerpo al calificar", async () => {
    // La tabla tiene clave compuesta: con el cardId solo no basta.
    fetchMock.mockReturnValue(responder(200, {}));
    await api.review("crd_0001", "algebra-lineal", "easy");

    const { url, init } = ultimaLlamada();
    expect(url).toContain("/flashcards/crd_0001/review");
    expect(JSON.parse(init.body as string)).toEqual({
      topicId: "algebra-lineal",
      rating: "easy",
    });
  });

  it("omite los parámetros de consulta vacíos", async () => {
    fetchMock.mockReturnValue(responder(200, { items: [] }));
    await api.topics(undefined);
    expect(ultimaLlamada().url).not.toContain("?");
  });

  it("une los cardIds para «Repasar errores»", async () => {
    fetchMock.mockReturnValue(responder(200, {}));
    await api.dueCards("algebra-lineal", { cardIds: ["crd_0003", "crd_0007"] });
    expect(ultimaLlamada().url).toContain("cardIds=crd_0003%2Ccrd_0007");
  });
});
