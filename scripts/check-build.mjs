#!/usr/bin/env node
/**
 * Revisa `dist/` antes de subirlo a S3.
 *
 * Las URLs de las APIs ya no se incrustan al compilar: se configuran en la
 * propia aplicación y se guardan en el navegador. Lo que sí conviene revisar
 * es que el build exista, que tenga su index y que no se haya colado una URL
 * de ejemplo en el código.
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const DIST = "dist";

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

// 2. No debe quedar ninguna URL de ejemplo incrustada en el código.
const scripts = files.filter((f) => f.endsWith(".js"));
const bundle = scripts.map((f) => readFileSync(f, "utf8")).join("");

const reales = [
  ...bundle.matchAll(/https:\/\/(?!abc123xyz)[a-z0-9]{6,}\.execute-api\.[a-z0-9-]+\.amazonaws\.com/gi),
];
if (reales.length > 0) {
  fail(
    "El build lleva una URL de API incrustada",
    `Encontrada: ${reales[0][0]}. Las URLs se configuran en la aplicación, no en el código.`,
  );
}

const total = files.reduce((sum, f) => sum + statSync(f).size, 0);

console.log("\n  Listo para subir a S3\n");
console.log(`    Archivos   ${files.length}`);
console.log(`    Tamaño     ${(total / 1024).toFixed(0)} KB\n`);
console.log("    Las URLs de las APIs se configuran al abrir la aplicación.\n");
