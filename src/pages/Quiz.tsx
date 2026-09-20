/**
 * Quiz de autoevaluación (historia 6, prototipo pp. 12-15).
 *
 * Cuatro estados en una misma ruta: portada, preguntas, resultado y bloqueo
 * por conceptos insuficientes.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { QuestionIcon, Sparkle } from "../components/icons";
import { Button, Card, LinkButton, Loading, ProgressBar, cx } from "../components/ui";
import { ApiError, api } from "../lib/api";
import { formatClock } from "../lib/format";
import type { NotEnoughConcepts, Quiz as QuizType, QuizResult } from "../lib/types";

type Fase =
  | { tipo: "portada" }
  | { tipo: "jugando"; quiz: QuizType }
  | { tipo: "resultado"; resultado: QuizResult };

export function Quiz() {
  const { topicId = "" } = useParams();
  const queryClient = useQueryClient();
  const [fase, setFase] = useState<Fase>({ tipo: "portada" });

  const tema = useQuery({
    queryKey: ["topic-progress", topicId],
    queryFn: () => api.topicProgress(topicId),
    retry: false,
  });

  const iniciar = useMutation({
    mutationFn: () => api.startQuiz(topicId),
    onSuccess: (quiz) => setFase({ tipo: "jugando", quiz }),
  });

  const enviar = useMutation({
    mutationFn: ({
      quizId,
      answers,
      durationSeconds,
    }: {
      quizId: string;
      answers: { questionId: string; selected: string | null }[];
      durationSeconds: number;
    }) => api.submitQuiz(quizId, answers, durationSeconds),
    onSuccess: (resultado) => {
      setFase({ tipo: "resultado", resultado });
      queryClient.invalidateQueries({ queryKey: ["progress"] });
    },
  });

  if (fase.tipo === "jugando") {
    return (
      <Preguntas
        quiz={fase.quiz}
        enviando={enviar.isPending}
        onSubmit={(answers, durationSeconds) =>
          enviar.mutate({ quizId: fase.quiz.quizId, answers, durationSeconds })
        }
      />
    );
  }

  if (fase.tipo === "resultado") {
    return <Resultado resultado={fase.resultado} topicId={topicId} />;
  }

  // --- Portada y bloqueo ---------------------------------------------------

  const error = iniciar.error;
  if (error instanceof ApiError && error.code === "NOT_ENOUGH_CONCEPTS") {
    return <Bloqueado detalles={error.details as unknown as NotEnoughConcepts} />;
  }

  // El progreso puede responder 404 si el usuario aún no ha repasado nada en
  // este tema: es esperado y no debe impedir intentar el quiz.
  if (tema.isLoading) return <Loading />;

  const nombre = tema.data?.topicName ?? topicId;
  const estudiados = tema.data
    ? tema.data.cardsTotal - (tema.data.cardsPending - tema.data.cardsMastered)
    : null;

  return (
    <div className="grid justify-items-center gap-4 py-10 text-center">
      <span className="grid h-14 w-14 place-items-center rounded-full bg-brand-soft text-brand">
        <QuestionIcon className="h-7 w-7" />
      </span>

      <p className="text-[11.5px] font-bold uppercase tracking-[0.09em] text-brand">
        Autoevaluación
      </p>
      <h1 className="max-w-md text-[28px] font-bold leading-tight tracking-tight">
        Pon a prueba {nombre}
      </h1>
      <p className="max-w-sm text-sm text-body">
        10 preguntas de opción múltiple basadas en los conceptos que ya estudiaste
        {estudiados !== null && estudiados > 0 ? ` (${tema.data!.cardsMastered} dominados)` : ""}.
      </p>

      <ul className="mt-2 grid gap-1.5 text-sm text-body">
        <li>10 preguntas</li>
        <li>6 minutos</li>
        <li className="font-semibold text-mint-ink">+120 XP al completar</li>
      </ul>

      {error && !(error instanceof ApiError && error.code === "NOT_ENOUGH_CONCEPTS") && (
        <p className="text-[13px] text-coral" role="alert">
          {error instanceof ApiError ? error.message : "No pudimos generar el quiz."}
        </p>
      )}

      <Button className="mt-3" loading={iniciar.isPending} onClick={() => iniciar.mutate()}>
        Comenzar quiz
      </Button>
    </div>
  );
}

// --- Preguntas ---------------------------------------------------------------

function Preguntas({
  quiz,
  enviando,
  onSubmit,
}: {
  quiz: QuizType;
  enviando: boolean;
  onSubmit: (
    answers: { questionId: string; selected: string | null }[],
    durationSeconds: number,
  ) => void;
}) {
  const [index, setIndex] = useState(0);
  const [respuestas, setRespuestas] = useState<Record<string, string>>({});
  const [restante, setRestante] = useState(quiz.timeLimitSeconds);
  const enviado = useRef(false);

  const entregar = useCallback(() => {
    if (enviado.current) return;
    enviado.current = true;
    onSubmit(
      quiz.questions.map((q) => ({
        questionId: q.questionId,
        selected: respuestas[q.questionId] ?? null,
      })),
      quiz.timeLimitSeconds - restante,
    );
  }, [onSubmit, quiz, respuestas, restante]);

  // Al agotarse el tiempo el quiz se autoenvía con lo respondido, en vez de
  // invalidarse: perder nueve aciertos por no llegar al décimo no enseña nada.
  useEffect(() => {
    if (restante <= 0) {
      entregar();
      return;
    }
    const id = setTimeout(() => setRestante((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [restante, entregar]);

  const pregunta = quiz.questions[index];
  const seleccion = respuestas[pregunta.questionId];
  const ultima = index === quiz.questions.length - 1;
  const quedaPoco = restante <= 60;

  return (
    <div className="grid gap-5">
      <div>
        <div className="flex items-baseline justify-between">
          <p className="text-sm font-bold text-brand">
            Pregunta {index + 1} de {quiz.questions.length}
          </p>
          <p
            className={cx(
              "text-sm tabular-nums",
              quedaPoco ? "font-bold text-coral" : "text-body",
            )}
            role="timer"
          >
            {formatClock(restante)}
          </p>
        </div>
        <ProgressBar percent={(index / quiz.questions.length) * 100} className="mt-2.5" />
      </div>

      <h1 className="text-[22px] font-medium leading-snug">{pregunta.prompt}</h1>

      <div className="grid gap-2.5">
        {pregunta.options.map((opcion) => {
          const elegida = seleccion === opcion.key;
          return (
            <button
              key={opcion.key}
              onClick={() =>
                setRespuestas((prev) => ({ ...prev, [pregunta.questionId]: opcion.key }))
              }
              aria-pressed={elegida}
              className={cx(
                "rounded-card border px-4 py-3.5 text-left text-sm transition-colors",
                elegida
                  ? "border-brand bg-brand-soft font-semibold text-ink"
                  : "border-line bg-white hover:border-brand/40",
              )}
            >
              <span className="mr-2 font-bold text-body">{opcion.key}.</span>
              {opcion.text}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {index > 0 && (
          <Button variant="ghost" onClick={() => setIndex((i) => i - 1)}>
            Anterior
          </Button>
        )}
        {ultima ? (
          <Button loading={enviando} onClick={entregar}>
            Terminar quiz
          </Button>
        ) : (
          <Button onClick={() => setIndex((i) => i + 1)}>Siguiente</Button>
        )}
        <p className="text-[12.5px] text-body">
          {Object.keys(respuestas).length} de {quiz.questions.length} respondidas
        </p>
      </div>
    </div>
  );
}

// --- Resultado ---------------------------------------------------------------

function Resultado({ resultado, topicId }: { resultado: QuizResult; topicId: string }) {
  const aprobado = resultado.score >= 70;
  const errores = resultado.conceptsToReview;

  return (
    <div className="grid justify-items-center gap-4 py-8 text-center">
      <span
        className={cx(
          "grid h-32 w-32 place-items-center rounded-full font-display text-4xl font-extrabold",
          aprobado ? "bg-mint text-mint-ink" : "bg-brand-soft text-brand",
        )}
      >
        {resultado.correctCount}/{resultado.total}
      </span>

      <h1 className="text-2xl font-bold">
        {aprobado ? "¡Muy buen trabajo!" : "Sigue practicando"}
      </h1>

      <p className="flex items-center gap-1.5 font-semibold text-brand">
        <Sparkle className="h-4 w-4" />+{resultado.xpAwarded} XP obtenidos
      </p>

      {resultado.timedOut && (
        <p className="text-[13px] text-body">Se acabó el tiempo y enviamos tus respuestas.</p>
      )}

      {errores.length > 0 && (
        <Card className="mt-2 w-full max-w-md p-5 text-left">
          <h2 className="font-semibold">Conceptos para repasar</h2>
          <ul className="mt-3 grid gap-2">
            {errores.map((concepto) => (
              <li key={concepto.cardId} className="flex gap-2 text-sm text-coral">
                <span aria-hidden="true">•</span>
                <span>{concepto.concept}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <div className="mt-3 flex flex-wrap justify-center gap-2.5">
        {errores.length > 0 && (
          <LinkButton
            to={`/repasar/${topicId}?cardIds=${errores.map((c) => c.cardId).join(",")}`}
            variant="soft"
          >
            Repasar errores
          </LinkButton>
        )}
        <LinkButton to="/inicio">Volver al inicio</LinkButton>
      </div>
    </div>
  );
}

// --- Bloqueo (prototipo p. 15) ----------------------------------------------

function Bloqueado({ detalles }: { detalles: NotEnoughConcepts }) {
  const navigate = useNavigate();
  const faltan = detalles.required - detalles.studied;

  return (
    <div className="grid justify-items-center gap-3.5 py-14 text-center">
      <span className="grid h-14 w-14 place-items-center rounded-full bg-brand-soft text-2xl">
        📚
      </span>
      <h1 className="text-2xl font-bold">Aún no está listo</h1>
      <p className="max-w-sm text-sm leading-relaxed text-body">
        Necesitas estudiar al menos {detalles.required} conceptos. Llevas{" "}
        <strong className="text-ink">{detalles.studied}</strong> en {detalles.topicName}.
      </p>
      <p className="text-[13px] text-body">
        {faltan === 1 ? "Te falta 1 concepto." : `Te faltan ${faltan} conceptos.`}
      </p>
      <Button className="mt-3" onClick={() => navigate(-1)}>
        Seguir estudiando
      </Button>
      <Link to="/inicio" className="text-sm text-body hover:text-ink">
        Volver al inicio
      </Link>
    </div>
  );
}
