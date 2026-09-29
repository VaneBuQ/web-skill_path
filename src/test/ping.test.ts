/**
 * Sonda de conexión de la pantalla de Configuración.
 *
 * Equivocarse al pegar una de las seis URLs deja la aplicación medio rota en
 * silencio, así que la sonda tiene que distinguir «no responde» de «responde,
 * pero es otro microservicio».
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ping } from "../lib/api";
import { refreshConfig, saveConfig } from "../lib/config";
import { URLS_DE_PRUEBA } from "./setup";

const fetchMock = vi.fn();

function responder(status: number, body = "") {
  return Promise.resolve({
    ok: status < 400,
    status,
    text: () => Promise.resolve(body),
  } as Response);
}

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockReset();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("probar la conexión de un servicio", () => {
  it("un 200 es que responde", async () => {
    fetchMock.mockReturnValue(responder(200, '{"items":[]}'));
    expect(await ping("topics")).toEqual({ estado: "ok", status: 200 });
  });

  it("un 401 también: la URL es correcta, solo falta la sesión", async () => {
    fetchMock.mockReturnValue(responder(401, '{"error":{"code":"UNAUTHENTICATED"}}'));
    expect(await ping("progress")).toEqual({ estado: "ok", status: 401 });
  });

  it("un 404 nuestro es la URL correcta: el recurso de prueba no existe", async () => {
    fetchMock.mockReturnValue(responder(404, '{"error":{"code":"NOT_FOUND"}}'));
    expect(await ping("flashcards")).toEqual({ estado: "ok", status: 404 });
  });

  it("el 404 de API Gateway delata que la URL es de otro microservicio", async () => {
    // Sin nuestro envelope: la ruta no existe en esa API.
    fetchMock.mockReturnValue(responder(404, '{"message":"Not Found"}'));
    expect(await ping("quiz")).toEqual({ estado: "ruta-desconocida", status: 404 });
  });

  it("una URL que no resuelve se reporta como inalcanzable", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));
    expect(await ping("ia")).toEqual({ estado: "inalcanzable" });
  });

  it("sin URL configurada no se llama a la red", async () => {
    saveConfig({ ...URLS_DE_PRUEBA, auth: "" });
    refreshConfig();

    expect(await ping("auth")).toEqual({ estado: "sin-url" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("cada servicio se prueba contra su propia URL base", async () => {
    fetchMock.mockReturnValue(responder(200));
    await ping("quiz");

    expect(String(fetchMock.mock.calls.at(-1)![0])).toContain("https://quiz.ejemplo.test/quiz/");
  });
});
