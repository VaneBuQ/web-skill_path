/**
 * Sesión de repaso (historias 2 y 3, prototipo V2 p. 7).
 *
 * El usuario escribe con sus palabras lo que sabe del concepto y una IA decide
 * si acertó. Eso es lo que distingue a SkillPath de una app de flashcards
 * normal: en el repaso clásico uno ve la respuesta y se autocalifica, lo que
 * mide reconocimiento y no recuerdo.
 *
 * Escribir la respuesta es opcional: «Ver respuesta» sigue disponible para
 * quien solo quiera repasar rápido.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { Sparkle } from "../components/icons";
import {
  Button,
  Card,
  ErrorState,
  LinkButton,
  Loading,
  ProgressBar,
  Textarea,
  cx,
} from "../components/ui";
import { ApiError, api } from "../lib/api";
import { AI_MAX_ANSWER_WORDS, type AnswerCheck, type Rating } from "../lib/types";

const CALIFICACIONES: { rating: Rating; label: string; className: string }[] = [
  { rating: "easy", label: "Fácil", className: "bg-mint text-mint-ink hover:bg-mint/80" },
  { rating: "hard", label: "Difícil", className: "bg-brand-soft text-brand hover:bg-brand-softer" },
  { rating: "forgot", label: "Olvidé", className: "bg-coral-soft text-coral hover:bg-coral hover:text-white" },
];

const VEREDICTO = {
  correcta: { label: "Correcta", clase: "border-mint-ink/30 bg-mint text-mint-ink" },
  parcial: { label: "A medias", clase: "border-amber-400/40 bg-amber-50 text-amber-700" },
  incorrecta: { label: "Incorrecta", clase: "border-coral/30 bg-coral-soft text-coral" },
} as const;

function contarPalabras(texto: string): number {
  return texto.trim() ? texto.trim().split(/\s+/).length : 0;
}

export function Review() {
  const { topicId = "" } = useParams();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();

  // El botón «Repasar errores» del quiz llega con los ids que se fallaron.
  const cardIds = searchParams.get("cardIds")?.split(",").filter(Boolean);

  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [check, setCheck] = useState<AnswerCheck | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [xpGanado, setXpGanado] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const sesion = useQuery({
    queryKey: ["due-cards", topicId, cardIds?.join(",") ?? ""],
    queryFn: () => api.dueCards(topicId, cardIds ? { cardIds } : undefined),
    // La lista se congela al empezar: reordenarla a media sesión sería confuso.
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });

  const tarjetas = sesion.data?.items ?? [];
  const tarjeta = tarjetas[index];
  const terminado = !sesion.isLoading && (tarjetas.length === 0 || index >= tarjetas.length);

  const comprobar = useMutation({
    mutationFn: () => api.checkAnswer(topicId, tarjeta!.cardId, answer),
    onSuccess: (resultado) => {
      setCheck(resultado);
      setRevealed(true);
    },
  });

  const calificar = useMutation({
    mutationFn: (rating: Rating) => api.review(tarjeta!.cardId, topicId, rating),
    onSuccess: (result) => {
      setXpGanado((xp) => xp + result.xpAwarded);
      setAnswer("");
      setCheck(null);
      setRevealed(false);
      setIndex((i) => i + 1);
      queryClient.invalidateQueries({ queryKey: ["progress"] });
    },
  });

  // Al cambiar de tarjeta, el foco vuelve al cuadro de texto.
  useEffect(() => {
    if (!revealed) textareaRef.current?.focus();
  }, [index, revealed]);

  if (sesion.isLoading) return <Loading label="Preparando tu sesión…" />;
  if (sesion.isError) {
    return (
      <ErrorState
        message={
          sesion.error instanceof ApiError
            ? sesion.error.message
            : "No pudimos cargar las tarjetas."
        }
      />
    );
  }

  const nombre = sesion.data!.topicName ?? topicId;
  if (terminado) return <SesionTerminada nombre={nombre} repasadas={index} xp={xpGanado} />;

  const palabras = contarPalabras(answer);
  const excedido = palabras > AI_MAX_ANSWER_WORDS;

  return (
    <div className="grid gap-5">
      <div>
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-[11.5px] font-bold uppercase tracking-[0.09em] text-brand">
            {nombre} · Tarjeta {index + 1} de {tarjetas.length}
          </p>
          {xpGanado > 0 && <p className="text-[13px] font-semibold text-mint-ink">+{xpGanado} XP</p>}
        </div>
        <ProgressBar percent={(index / tarjetas.length) * 100} className="mt-2.5" />
      </div>

      <Card className="p-6 sm:p-7">
        <p className="text-[11.5px] font-bold uppercase tracking-[0.09em] text-body">
          Concepto técnico
        </p>
        <h1 className="mt-3 text-[22px] font-bold leading-snug sm:text-2xl">
          {tarjeta.question}
        </h1>
      </Card>

      {!revealed ? (
        <div className="grid gap-3">
          <label htmlFor="respuesta" className="text-[13px] font-semibold">
            Escribe lo que sabes de este concepto
          </label>
          <Textarea
            id="respuesta"
            ref={textareaRef}
            value={answer}
            rows={4}
            placeholder="Responde con tus propias palabras…"
            onChange={(e) => setAnswer(e.target.value)}
            onKeyDown={(e) => {
              // Enviar con Ctrl/Cmd + Enter, como en cualquier formulario largo.
              if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && answer.trim() && !excedido) {
                comprobar.mutate();
              }
            }}
          />

          <div className="flex flex-wrap items-center justify-between gap-3">
            <span
              className={cx(
                "text-[12.5px] tabular-nums",
                excedido ? "font-semibold text-coral" : "text-body",
              )}
            >
              {palabras} / {AI_MAX_ANSWER_WORDS} palabras
            </span>
            <div className="flex flex-wrap gap-2.5">
              <Button
                variant="ghost"
                onClick={() => {
                  setRevealed(true);
                  setCheck(null);
                }}
              >
                Ver respuesta
              </Button>
              <Button
                loading={comprobar.isPending}
                disabled={!answer.trim() || excedido}
                onClick={() => comprobar.mutate()}
              >
                <Sparkle className="h-4 w-4" />
                Comprobar con IA
              </Button>
            </div>
          </div>

          {excedido && (
            <p className="text-[13px] text-coral" role="alert">
              Tu respuesta supera las {AI_MAX_ANSWER_WORDS} palabras. Resúmela para que la IA
              pueda evaluarla.
            </p>
          )}

          {comprobar.isError && (
            <p className="text-[13px] text-coral" role="alert">
              {comprobar.error instanceof ApiError
                ? comprobar.error.message
                : "No pudimos evaluar tu respuesta."}
            </p>
          )}
        </div>
      ) : (
        <div className="grid gap-4">
          {check && (
            <>
              <div className="grid gap-1.5 rounded-card bg-brand-softer p-4">
                <p className="text-[12.5px] font-semibold text-body">Tu respuesta:</p>
                <p className="text-sm">{check.yourAnswer}</p>
              </div>

              <div className={cx("grid gap-2 rounded-card border p-4", VEREDICTO[check.verdict].clase)}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[12.5px] font-bold uppercase tracking-wide">
                    {VEREDICTO[check.verdict].label}
                  </span>
                  <span className="text-[12.5px] font-semibold tabular-nums">
                    {check.score} / 100
                  </span>
                </div>
                {check.feedback && <p className="text-sm">{check.feedback}</p>}
              </div>
            </>
          )}

          <div className="grid gap-1.5 rounded-card border border-mint-ink/25 bg-mint p-4">
            <p className="text-[12.5px] font-semibold text-mint-ink">Respuesta correcta:</p>
            <p className="text-sm text-mint-ink">{tarjeta.answer}</p>
            {tarjeta.hint && (
              <p className="mt-1 text-[12.5px] text-mint-ink/80">
                Pista de memoria: {tarjeta.hint}
              </p>
            )}
          </div>

          <div className="grid gap-2.5">
            <p className="text-[13px] text-body">
              {check
                ? "¿Qué tan bien la recordaste? La IA sugiere una, pero decides tú."
                : "¿Qué tan bien la recordaste?"}
            </p>
            <div className="flex flex-wrap gap-2.5">
              {CALIFICACIONES.map(({ rating, label, className }) => (
                <button
                  key={rating}
                  onClick={() => calificar.mutate(rating)}
                  disabled={calificar.isPending}
                  className={cx(
                    "rounded-full px-6 py-2.5 text-sm font-semibold transition-colors disabled:opacity-50",
                    className,
                    // La sugerencia de la IA se resalta, como en el prototipo.
                    check?.suggestedRating === rating && "ring-2 ring-brand ring-offset-2",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {calificar.isError && (
            <p className="text-[13px] text-coral" role="alert">
              {calificar.error instanceof ApiError
                ? calificar.error.message
                : "No pudimos guardar tu calificación."}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/** Pantalla «No hay tarjetas pendientes por hoy» del prototipo. */
function SesionTerminada({
  nombre,
  repasadas,
  xp,
}: {
  nombre: string;
  repasadas: number;
  xp: number;
}) {
  const primeraVez = repasadas === 0;

  return (
    <div className="grid justify-items-center gap-3 py-12 text-center">
      <span className="grid h-16 w-16 place-items-center rounded-full bg-brand-soft text-brand">
        <Sparkle className="h-7 w-7" />
      </span>

      <h1 className="mt-2 text-2xl font-bold">
        {primeraVez ? "No hay tarjetas pendientes por hoy." : "¡Sesión completada!"}
      </h1>

      <p className="max-w-sm text-sm text-body">
        {primeraVez
          ? "¡Buen trabajo! Has completado todas las tarjetas de hoy."
          : `Repasaste ${repasadas} ${repasadas === 1 ? "concepto" : "conceptos"} de ${nombre}${
              xp > 0 ? ` y ganaste ${xp} XP` : ""
            }.`}
      </p>

      <div className="mt-3 flex flex-wrap justify-center gap-2.5">
        <LinkButton to="/inicio">Volver al inicio</LinkButton>
        {!primeraVez && (
          <Link
            to="/progreso"
            className="inline-flex items-center rounded-full border border-line px-5 py-2.5 text-sm font-semibold text-body transition-colors hover:bg-white"
          >
            Ver mi progreso
          </Link>
        )}
      </div>
    </div>
  );
}
