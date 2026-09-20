#!/usr/bin/env node
/**
 * Revisa `dist/` antes de subirlo a S3.
 *
 * Vite incrusta `VITE_API_BASE_URL` **en el momento del build**, no al
 * ejecutarse: si se compila sin `.env`, el sitio queda apuntando a ninguna
 * parte y el error solo aparece en producción, cuando todas las llamadas
 * fallan. Esta comprobación lo detecta antes de subir nada.
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const DIST = "dist";
const PLACEHOLDER = "TU-API";

function walk(dir) {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

function fail(message, hint) {
  console.error(`\n  ✗ ${message}`);
  if (hint) console.error(`    ${hint}`);
  process.exit(1);
}

let files;
try {
  files = walk(DIST);
} catch {
  fail("No existe dist/", "Ejecuta `npm run build` primero.");
}

// 1. El index tiene que estar: es el punto de entrada de la SPA.
if (!files.includes(join(DIST, "index.html"))) {
  fail("Falta dist/index.html");
}

// 2. La URL de la API tiene que ser real.
const scripts = files.filter((f) => f.endsWith(".js"));
const bundle = scripts.map((f) => readFileSync(f, "utf8")).join("");

if (bundle.includes(PLACEHOLDER)) {
  fail(
    "El build apunta a la URL de ejemplo",
    "Copia .env.example a .env, pon la URL real de tu etapa en API Gateway y vuelve a compilar.",
  );
}

const urls = [...bundle.matchAll(/https:\/\/[a-z0-9.-]*execute-api[a-z0-9.-]*\/[a-z]+/gi)];
if (urls.length === 0) {
  fail(
    "El build no lleva ninguna URL de API Gateway",
    "Vite incrusta VITE_API_BASE_URL al compilar: define .env y ejecuta `npm run build` de nuevo.",
  );
}

const total = files.reduce((sum, f) => sum + statSync(f).size, 0);

console.log("\n  Listo para subir a S3\n");
console.log(`    API        ${[...new Set(urls.map((m) => m[0]))].join(", ")}`);
console.log(`    Archivos   ${files.length}`);
console.log(`    Tamaño     ${(total / 1024).toFixed(0)} KB\n`);
console.log("    Sube el CONTENIDO de dist/ a la raíz del bucket, no la carpeta.\n");
