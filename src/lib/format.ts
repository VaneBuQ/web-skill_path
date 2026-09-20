/** Formateo de datos para pantalla. */

const MESES = [
  "ene", "feb", "mar", "abr", "may", "jun",
  "jul", "ago", "sep", "oct", "nov", "dic",
];

/** «2026-09-12T18:20:00Z» → «12 sep 2026», como en el prototipo. */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return `${date.getDate()} ${MESES[date.getMonth()]} ${date.getFullYear()}`;
}

/** Fecha en palabras cuando es reciente: «Hoy», «Ayer» o la fecha. */
export function formatRelativeDate(iso: string | null | undefined): string {
  if (!iso) return "Nunca";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Nunca";

  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const days = Math.round(
    (startOfDay(new Date()).getTime() - startOfDay(date).getTime()) / 86_400_000,
  );

  if (days === 0) return "Hoy";
  if (days === 1) return "Ayer";
  return formatDate(iso);
}

/** 2480 → «2,480», como lo pinta el prototipo. */
export function formatNumber(value: number): string {
  return value.toLocaleString("es-PE");
}

/** 214 → «03:34» */
export function formatClock(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const minutes = String(Math.floor(safe / 60)).padStart(2, "0");
  const seconds = String(safe % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

/** «Lucía Mendoza» → «LM». Igual que en el backend, para no depender de la red. */
export function initialsOf(name: string): string {
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
