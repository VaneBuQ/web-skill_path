/**
 * Sesión de repaso (historias 2 y 3, prototipo pp. 8-10).
 *
 * La respuesta llega junto con la pregunta, así que voltear la tarjeta es
 * instantáneo y no hace falta un segundo viaje al servidor.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { Button, ErrorState, LinkButton, Loading, ProgressBar } from "../components/ui";
import { ApiError, api } from "../lib/api";
import type { Rating } from "../lib/types";

const CALIFICACIONES: { rating: Rating; label: string; className: string }[] = [
  { rating: "forgot", label: "Olvidé", className: "bg-coral text-white hover:bg-coral/90" },
  { rating: "hard", label: "Difícil", className: "bg-brand-soft text-brand hover:bg-brand-softer" },
  { rating: "easy", label: "Fácil", className: "bg-mint-ink text-white hover:bg-mint-ink/90" },
];

export function Review() {
  const { topicId = "" } = useParams();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();

  // El botón «Repasar errores» del quiz llega con los ids que se fallaron.
  const cardIds = searchParams.get("cardIds")?.split(",").filter(Boolean);

  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [xpGanado, setXpGanado] = useState(0);

  const sesion = useQuery({
    queryKey: ["due-cards", topicId, cardIds?.join(",") ?? ""],
    queryFn: () => api.dueCards(topicId, cardIds ? { cardIds } : undefined),
    // La lista se congela al empezar: reordenarla a media sesión sería confuso.
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });

  const calificar = useMutation({
    mutationFn: (rating: Rating) => api.review(tarjeta!.cardId, topicId, rating),
    onSuccess: (result) => {
      setXpGanado((xp) => xp + result.xpAwarded);
      setFlipped(false);
      setIndex((i) => i + 1);
      queryClient.invalidateQueries({ queryKey: ["progress"] });
    },
  });

  const tarjetas = sesion.data?.items ?? [];
  const tarjeta = tarjetas[index];
  const terminado = !sesion.isLoading && (tarjetas.length === 0 || index >= tarjetas.length);

  // Atajos de teclado: espacio voltea, 1/2/3 califican.
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (!tarjeta || calificar.isPending) return;
      if (event.code === "Space" || event.code === "Enter") {
        if (!flipped) {
          event.preventDefault();
          setFlipped(true);
        }
        return;
      }
      if (!flipped) return;
      const atajo = { Digit1: "forgot", Digit2: "hard", Digit3: "easy" } as const;
      const rating = atajo[event.code as keyof typeof atajo];
      if (rating) calificar.mutate(rating);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [tarjeta, flipped, calificar]);

  if (sesion.isLoading) return <Loading label="Preparando tu sesión…" />;
  if (sesion.isError) {
    const error = sesion.error;
    return (
      <ErrorState
        message={error instanceof ApiError ? error.message : "No pudimos cargar las tarjetas."}
      />
    );
  }

  const nombre = sesion.data!.topicName ?? topicId;

  if (terminado) return <SesionTerminada nombre={nombre} repasadas={index} xp={xpGanado} />;

  return (
    <div className="grid gap-5">
      <div>
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-[11.5px] font-bold uppercase tracking-[0.09em] text-brand">
            {nombre} · {index + 1} de {tarjetas.length}
          </p>
          {xpGanado > 0 && <p className="text-[13px] font-semibold text-mint-ink">+{xpGanado} XP</p>}
        </div>
        <ProgressBar percent={(index / tarjetas.length) * 100} className="mt-2.5" />
      </div>

      <div className="animate-flip rounded-panel bg-surface-dark p-7 sm:p-9" key={tarjeta.cardId + String(flipped)}>
        <p
          className={`text-[11.5px] font-bold uppercase tracking-[0.09em] ${
            flipped ? "text-mint-ink" : "text-brand"
          }`}
        >
          {flipped ? "Respuesta" : "Concepto"}
        </p>

        <p className="mt-5 text-[22px] font-medium leading-snug text-white sm:text-[26px]">
          {flipped ? tarjeta.answer : tarjeta.question}
        </p>

        {flipped && tarjeta.hint && (
          <p className="mt-6 text-sm leading-relaxed text-white/55">
            Pista de memoria: {tarjeta.hint}
          </p>
        )}
      </div>

      {!flipped ? (
        <Button onClick={() => setFlipped(true)} className="justify-self-start">
          Ver respuesta
        </Button>
      ) : (
        <div className="grid gap-2.5">
          <p className="text-[13px] text-body">¿Qué tan bien la recordaste?</p>
          <div className="flex flex-wrap gap-2.5">
            {CALIFICACIONES.map(({ rating, label, className }) => (
              <button
                key={rating}
                onClick={() => calificar.mutate(rating)}
                disabled={calificar.isPending}
                className={`rounded-full px-6 py-2.5 text-sm font-semibold transition-colors disabled:opacity-50 ${className}`}
              >
                {label}
              </button>
            ))}
          </div>
          <p className="text-[12px] text-body/70">
            Atajos: <kbd>espacio</kbd> voltea · <kbd>1</kbd> Olvidé · <kbd>2</kbd> Difícil ·{" "}
            <kbd>3</kbd> Fácil
          </p>
        </div>
      )}

      {calificar.isError && (
        <p className="text-[13px] text-coral" role="alert">
          {calificar.error instanceof ApiError
            ? calificar.error.message
            : "No pudimos guardar tu calificación."}
        </p>
      )}
    </div>
  );
}

/** Pantalla «¡Todo al día!» (prototipo p. 10). */
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
      <span className="grid h-16 w-16 place-items-center rounded-full bg-mint text-3xl">
        {primeraVez ? "☀️" : "🎉"}
      </span>

      <h1 className="mt-2 text-2xl font-bold">
        {primeraVez ? "¡Todo al día!" : "¡Sesión completada!"}
      </h1>

      <p className="max-w-sm text-sm text-body">
        {primeraVez
          ? "No tienes tarjetas pendientes en este tema. Vuelve mañana para fortalecer tu memoria."
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
