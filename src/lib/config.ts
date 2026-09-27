/**
 * URLs de los microservicios.
 *
 * Cada microservicio despliega su propio API Gateway, así que no hay una sola
 * URL base sino seis. Se configuran en pantalla y se guardan en el navegador,
 * igual que el panel «Conexiones API» del proyecto de ejemplo.
 *
 * No se usa una variable de entorno de compilación a propósito: Vite la
 * incrustaría al construir, y cambiar de despliegue obligaría a recompilar y
 * volver a subir el sitio. Así basta con editarlas en la propia aplicación.
 */

export const SERVICES = [
  { key: "auth", label: "Autenticación", hint: "registro, inicio de sesión y perfil" },
  { key: "topics", label: "Temas y mazos", hint: "catálogo, «Mis temas» y mazos propios" },
  { key: "flashcards", label: "Tarjetas", hint: "repaso y calificación" },
  { key: "progress", label: "Progreso", hint: "racha, XP y dominio por tema" },
  { key: "quiz", label: "Quiz", hint: "examen de autoevaluación" },
  { key: "ia", label: "IA", hint: "comprobación de respuestas escritas" },
] as const;

export type ServiceKey = (typeof SERVICES)[number]["key"];

export type ApiConfig = Record<ServiceKey, string>;

const STORAGE_KEY = "skillpath.apiConfig";

const EMPTY: ApiConfig = {
  auth: "",
  topics: "",
  flashcards: "",
  progress: "",
  quiz: "",
  ia: "",
};

/** Quita la barra final para que al concatenar la ruta no salgan dos. */
function normalize(url: string): string {
  return url.trim().replace(/\/+$/, "");
}

export function loadConfig(): ApiConfig {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return { ...EMPTY };
    const parsed = JSON.parse(stored) as Partial<ApiConfig>;
    const config = { ...EMPTY };
    for (const { key } of SERVICES) {
      config[key] = normalize(parsed[key] ?? "");
    }
    return config;
  } catch {
    // Modo privado o almacenamiento bloqueado: la aplicación sigue
    // funcionando, solo que habrá que volver a escribir las URLs.
    return { ...EMPTY };
  }
}

export function saveConfig(config: ApiConfig): void {
  const normalized = { ...EMPTY };
  for (const { key } of SERVICES) {
    normalized[key] = normalize(config[key] ?? "");
  }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
  } catch {
    /* sin almacenamiento, la configuración dura lo que la pestaña */
  }
  cached = normalized;
}

/** En memoria para no leer localStorage en cada petición. */
let cached: ApiConfig | null = null;

export function apiBase(service: ServiceKey): string {
  if (!cached) cached = loadConfig();
  return cached[service];
}

export function refreshConfig(): void {
  cached = loadConfig();
}

/** ¿Están puestas las seis URLs? */
export function isConfigured(config: ApiConfig = loadConfig()): boolean {
  return SERVICES.every(({ key }) => config[key].length > 0);
}

export function missingServices(config: ApiConfig = loadConfig()) {
  return SERVICES.filter(({ key }) => !config[key]);
}
