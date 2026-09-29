import "@testing-library/jest-dom/vitest";

import { beforeEach } from "vitest";

import { SERVICES, refreshConfig } from "../lib/config";

/**
 * Las URLs de los microservicios se configuran en pantalla y viven en
 * localStorage, así que en las pruebas hay que sembrarlas: sin ellas el cliente
 * de API responde NOT_CONFIGURED y ninguna pantalla llega a pedir datos.
 */
export const URLS_DE_PRUEBA = Object.fromEntries(
  SERVICES.map(({ key }) => [key, `https://${key}.ejemplo.test`]),
) as Record<(typeof SERVICES)[number]["key"], string>;

beforeEach(() => {
  localStorage.setItem("skillpath.apiConfig", JSON.stringify(URLS_DE_PRUEBA));
  refreshConfig();
});
