/**
 * Cliente de la API de SkillPath.
 *
 * Todos los errores llegan con el mismo envelope
 * `{ error: { code, message, details } }`, y `message` ya viene en español y
 * apto para mostrarse tal cual: por eso `ApiError` lo expone directamente y
 * las pantallas no tienen que traducir códigos.
 */

import { apiBase, type ServiceKey } from "./config";
import type {
  AnswerCheck,
  Deck,
  DeckDetail,
  DueCards,
  FollowResult,
  FollowedTopic,
  NewCard,
  Profile,
  ProgressOverview,
  Quiz,
  QuizResult,
  Rating,
  Session,
  Topic,
  TopicProgress,
} from "./types";

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: Record<string, unknown>;

  constructor(
    status: number,
    code: string,
    message: string,
    details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }

  /** Cierra la sesión: el token venció o ya no vale. */
  get isUnauthenticated(): boolean {
    return this.status === 401;
  }
}

let authToken: string | null = null;

export function setAuthToken(token: string | null): void {
  authToken = token;
}

/**
 * Ruta de cada servicio que sirve para comprobar que su API Gateway responde.
 *
 * Se eligen rutas que existen y que fallan de forma reconocible sin sesión: lo
 * que se comprueba es que la URL apunte al servicio correcto, no que la
 * petición tenga éxito. Un 401 es una respuesta perfectamente válida aquí.
 */
const SONDA: Record<ServiceKey, { path: string; method?: string }> = {
  auth: { path: "/auth/me" },
  topics: { path: "/topics" },
  flashcards: { path: "/flashcards/__sonda__" },
  progress: { path: "/progress" },
  quiz: { path: "/quiz/__sonda__" },
  ia: { path: "/ia/history/__sonda__" },
};

export type PingResult =
  | { estado: "ok"; status: number }
  | { estado: "sin-url" }
  | { estado: "inalcanzable" }
  | { estado: "ruta-desconocida"; status: number };

/**
 * Comprueba que la URL configurada para un servicio responde y es la suya.
 *
 * Un 404 de API Gateway ("Not Found" sin nuestro envelope) significa que la
 * URL es de otro servicio: es el error más fácil de cometer pegando seis URLs
 * parecidas, y el que deja la aplicación en silencio.
 */
export async function ping(service: ServiceKey): Promise<PingResult> {
  const base = apiBase(service);
  if (!base) return { estado: "sin-url" };

  const { path, method = "GET" } = SONDA[service];
  let response: Response;
  try {
    response = await fetch(`${base}${path}`, { method });
  } catch {
    return { estado: "inalcanzable" };
  }

  // API Gateway responde {"message":"Not Found"} cuando la ruta no existe en
  // esa API; nuestros handlers responden siempre {"error":{"code":...}}.
  if (response.status === 404) {
    const texto = await response.text();
    if (!texto.includes('"error"')) return { estado: "ruta-desconocida", status: 404 };
  }

  return { estado: "ok", status: response.status };
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  query?: Record<string, string | number | undefined>;
  auth?: boolean;
}

/**
 * Cada microservicio tiene su propio API Gateway, así que la URL base se
 * resuelve por servicio en el momento de la llamada.
 */
async function request<T>(
  service: ServiceKey,
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { method = "GET", body, query, auth = true } = options;

  const base = apiBase(service);
  if (!base) {
    throw new ApiError(
      0,
      "NOT_CONFIGURED",
      "Falta configurar la URL del servicio. Ve a Configuración.",
    );
  }

  let url = `${base}${path}`;
  if (query) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== "") params.set(key, String(value));
    }
    const qs = params.toString();
    if (qs) url += `?${qs}`;
  }

  const headers: Record<string, string> = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (auth && authToken) headers.Authorization = `Bearer ${authToken}`;

  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    // Sin red o con la API caída no hay envelope que leer.
    throw new ApiError(
      0,
      "NETWORK_ERROR",
      "No pudimos conectar con el servidor. Revisa tu conexión.",
    );
  }

  if (response.status === 204) return undefined as T;

  const text = await response.text();
  let payload: unknown = null;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = null;
    }
  }

  if (!response.ok) {
    const envelope = (payload as { error?: { code?: string; message?: string; details?: Record<string, unknown> } } | null)?.error;
    throw new ApiError(
      response.status,
      envelope?.code ?? "UNKNOWN_ERROR",
      envelope?.message ?? "Ocurrió un error inesperado.",
      envelope?.details,
    );
  }

  return payload as T;
}

export const api = {
  // --- auth ---------------------------------------------------------------
  register: (name: string, email: string, password: string) =>
    request<Session>("auth", "/auth/register", {
      method: "POST",
      body: { name, email, password },
      auth: false,
    }),

  login: (email: string, password: string) =>
    request<Session>("auth", "/auth/login", {
      method: "POST",
      body: { email, password },
      auth: false,
    }),

  me: () => request<Profile>("auth", "/auth/me"),

  // --- temas --------------------------------------------------------------
  topics: (search?: string) =>
    request<{ items: Topic[] }>("topics", "/topics", { query: { search }, auth: false }),

  followTopic: (topicId: string) =>
    request<FollowResult>("topics", `/topics/${topicId}/follow`, { method: "POST" }),

  unfollowTopic: (topicId: string) =>
    request<void>("topics", `/topics/${topicId}/follow`, { method: "DELETE" }),

  myTopics: () => request<{ items: FollowedTopic[] }>("topics", "/me/topics"),

  // --- mazos propios (historia 8) ----------------------------------------
  myDecks: () => request<{ items: Deck[] }>("topics", "/me/decks"),

  deck: (topicId: string) => request<DeckDetail>("topics", `/me/decks/${topicId}`),

  createDeck: (name: string, description: string | null, cards: NewCard[]) =>
    request<Deck>("topics", "/me/decks", {
      method: "POST",
      body: { name, description, cards },
    }),

  renameDeck: (topicId: string, name: string, description?: string | null) =>
    request<Deck>("topics", `/me/decks/${topicId}`, {
      method: "PATCH",
      body: { name, description },
    }),

  deleteDeck: (topicId: string) =>
    request<void>("topics", `/me/decks/${topicId}`, { method: "DELETE" }),

  addCards: (topicId: string, cards: NewCard[]) =>
    request<{ topicId: string; cardCount: number }>("topics", `/me/decks/${topicId}/cards`, {
      method: "POST",
      body: { cards },
    }),

  deleteCard: (topicId: string, cardId: string) =>
    request<void>("topics", `/me/decks/${topicId}/cards/${cardId}`, { method: "DELETE" }),

  // --- repaso -------------------------------------------------------------
  dueCards: (topicId: string, options?: { cardIds?: string[]; limit?: number }) =>
    request<DueCards>("flashcards", `/flashcards/${topicId}`, {
      query: {
        cardIds: options?.cardIds?.join(","),
        limit: options?.limit,
      },
    }),

  review: (cardId: string, topicId: string, rating: Rating) =>
    request<import("./types").ReviewResult>("flashcards", `/flashcards/${cardId}/review`, {
      method: "POST",
      body: { topicId, rating },
    }),

  // --- progreso -----------------------------------------------------------
  progress: () => request<ProgressOverview>("progress", "/progress"),

  topicProgress: (topicId: string) =>
    request<TopicProgress>("progress", `/progress/${topicId}`),

  // --- quiz ---------------------------------------------------------------
  startQuiz: (topicId: string) =>
    request<Quiz>("quiz", `/quiz/${topicId}/start`, { method: "POST" }),

  submitQuiz: (
    quizId: string,
    answers: { questionId: string; selected: string | null }[],
    durationSeconds: number,
  ) =>
    request<QuizResult>("quiz", `/quiz/${quizId}/submit`, {
      method: "POST",
      body: { answers, durationSeconds },
    }),

  quiz: (quizId: string) =>
    request<Quiz & Partial<QuizResult>>("quiz", `/quiz/${quizId}`),

  // --- IA: comprueba la respuesta escrita --------------------------------
  checkAnswer: (topicId: string, cardId: string, answer: string) =>
    request<AnswerCheck>("ia", "/ia/check-answer", {
      method: "POST",
      body: { topicId, cardId, answer },
    }),

  answerHistory: (topicId: string) =>
    request<{ topicId: string; items: AnswerCheck[] }>("ia", `/ia/history/${topicId}`),
};
