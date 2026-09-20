/** Detalle de un mazo propio: editar tarjetas y eliminarlo (historia 8). */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type FormEvent, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Plus, Trash } from "../components/icons";
import {
  Button,
  Card,
  ErrorState,
  Field,
  Input,
  LinkButton,
  Loading,
  PageHeader,
  Textarea,
} from "../components/ui";
import { ApiError, api } from "../lib/api";
import { formatDate } from "../lib/format";

export function DeckDetail() {
  const { topicId = "" } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [agregando, setAgregando] = useState(false);
  const [confirmarBorrado, setConfirmarBorrado] = useState(false);
  const [renombrando, setRenombrando] = useState(false);

  const deck = useQuery({
    queryKey: ["deck", topicId],
    queryFn: () => api.deck(topicId),
    retry: false,
  });

  function refrescar() {
    queryClient.invalidateQueries({ queryKey: ["deck", topicId] });
    queryClient.invalidateQueries({ queryKey: ["my-decks"] });
    queryClient.invalidateQueries({ queryKey: ["my-topics"] });
  }

  const borrarTarjeta = useMutation({
    mutationFn: (cardId: string) => api.deleteCard(topicId, cardId),
    onSuccess: refrescar,
  });

  const borrarMazo = useMutation({
    mutationFn: () => api.deleteDeck(topicId),
    onSuccess: () => {
      refrescar();
      queryClient.invalidateQueries({ queryKey: ["progress"] });
      navigate("/mis-mazos", { replace: true });
    },
  });

  if (deck.isLoading) return <Loading />;
  if (deck.isError) {
    return (
      <ErrorState
        message={
          deck.error instanceof ApiError && deck.error.status === 404
            ? "Este mazo no existe o ya no es tuyo."
            : "No pudimos cargar el mazo."
        }
      />
    );
  }

  const mazo = deck.data!;

  return (
    <div className="grid gap-6">
      <PageHeader
        title={mazo.name}
        subtitle={`${mazo.cardCount} ${mazo.cardCount === 1 ? "concepto" : "conceptos"} · creado el ${formatDate(mazo.createdAt)}`}
        action={
          <div className="flex flex-wrap gap-2.5">
            <Button variant="ghost" size="sm" onClick={() => setRenombrando(true)}>
              Renombrar
            </Button>
            <Button variant="danger" size="sm" onClick={() => setConfirmarBorrado(true)}>
              Eliminar mazo
            </Button>
            <LinkButton to={`/repasar/${topicId}`} size="sm">
              Repasar
            </LinkButton>
          </div>
        }
      />

      {renombrando && (
        <Renombrar
          topicId={topicId}
          nombreActual={mazo.name}
          descripcionActual={mazo.description}
          onDone={() => {
            setRenombrando(false);
            refrescar();
          }}
          onCancel={() => setRenombrando(false)}
        />
      )}

      <div className="grid gap-2.5">
        {mazo.cards.map((tarjeta, index) => (
          <Card key={tarjeta.cardId} className="flex items-start gap-4 p-4 sm:px-5">
            <span className="flex-none pt-0.5 text-[13px] font-bold tabular-nums text-body">
              {String(index + 1).padStart(2, "0")}
            </span>
            <div className="min-w-0 flex-1 grid gap-1">
              <p className="font-semibold">{tarjeta.question}</p>
              <p className="text-[13.5px] text-body">{tarjeta.answer}</p>
              {tarjeta.hint && (
                <p className="mt-1 justify-self-start rounded-lg bg-mint px-2.5 py-1 text-[12.5px] text-mint-ink">
                  Pista: {tarjeta.hint}
                </p>
              )}
            </div>
            <button
              onClick={() => borrarTarjeta.mutate(tarjeta.cardId)}
              disabled={borrarTarjeta.isPending || mazo.cards.length === 1}
              title={
                mazo.cards.length === 1
                  ? "Un mazo necesita al menos una tarjeta"
                  : "Eliminar tarjeta"
              }
              aria-label={`Eliminar tarjeta ${index + 1}`}
              className="flex-none rounded-lg p-1.5 text-body transition-colors hover:bg-coral-soft hover:text-coral disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-body"
            >
              <Trash />
            </button>
          </Card>
        ))}
      </div>

      {agregando ? (
        <NuevaTarjeta
          topicId={topicId}
          onDone={() => {
            setAgregando(false);
            refrescar();
          }}
          onCancel={() => setAgregando(false)}
        />
      ) : (
        <Button
          variant="soft"
          size="sm"
          className="justify-self-start"
          onClick={() => setAgregando(true)}
        >
          <Plus />
          Agregar tarjeta
        </Button>
      )}

      {confirmarBorrado && (
        <ConfirmarBorrado
          nombre={mazo.name}
          cardCount={mazo.cardCount}
          borrando={borrarMazo.isPending}
          onConfirm={() => borrarMazo.mutate()}
          onCancel={() => setConfirmarBorrado(false)}
        />
      )}
    </div>
  );
}

// --- Subformularios ----------------------------------------------------------

function NuevaTarjeta({
  topicId,
  onDone,
  onCancel,
}: {
  topicId: string;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [hint, setHint] = useState("");

  const agregar = useMutation({
    mutationFn: () =>
      api.addCards(topicId, [
        { question: question.trim(), answer: answer.trim(), hint: hint.trim() || null },
      ]),
    onSuccess: onDone,
  });

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (question.trim() && answer.trim()) agregar.mutate();
  }

  return (
    <Card className="p-5">
      <form onSubmit={handleSubmit} className="grid gap-3.5">
        <p className="text-[13px] font-semibold">Nueva tarjeta</p>

        <Field label="Pregunta" htmlFor="nueva-q">
          <Textarea
            id="nueva-q"
            value={question}
            autoFocus
            placeholder="¿Qué concepto quieres recordar?"
            onChange={(e) => setQuestion(e.target.value)}
          />
        </Field>

        <Field label="Respuesta" htmlFor="nueva-a">
          <Textarea
            id="nueva-a"
            value={answer}
            placeholder="La explicación que quieres memorizar"
            onChange={(e) => setAnswer(e.target.value)}
          />
        </Field>

        <Field label="Pista de memoria" hint="(opcional)" htmlFor="nueva-h">
          <Input
            id="nueva-h"
            value={hint}
            placeholder="Algo que te ayude a recordarlo"
            onChange={(e) => setHint(e.target.value)}
          />
        </Field>

        {agregar.isError && (
          <p className="text-[13px] text-coral" role="alert">
            {agregar.error instanceof ApiError
              ? agregar.error.message
              : "No pudimos agregar la tarjeta."}
          </p>
        )}

        <div className="flex gap-2.5">
          <Button type="submit" size="sm" loading={agregar.isPending} disabled={!question.trim() || !answer.trim()}>
            Agregar
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
            Cancelar
          </Button>
        </div>
      </form>
    </Card>
  );
}

function Renombrar({
  topicId,
  nombreActual,
  descripcionActual,
  onDone,
  onCancel,
}: {
  topicId: string;
  nombreActual: string;
  descripcionActual: string | null;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(nombreActual);
  const [description, setDescription] = useState(descripcionActual ?? "");

  const renombrar = useMutation({
    mutationFn: () => api.renameDeck(topicId, name.trim(), description.trim() || null),
    onSuccess: onDone,
  });

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (name.trim()) renombrar.mutate();
  }

  return (
    <Card className="p-5">
      <form onSubmit={handleSubmit} className="grid gap-3.5">
        <Field label="Nombre del mazo" htmlFor="rename">
          <Input
            id="rename"
            value={name}
            maxLength={60}
            autoFocus
            onChange={(e) => setName(e.target.value)}
          />
        </Field>
        <Field label="Descripción" hint="(opcional)" htmlFor="rename-desc">
          <Textarea
            id="rename-desc"
            value={description}
            maxLength={200}
            onChange={(e) => setDescription(e.target.value)}
          />
        </Field>
        <div className="flex gap-2.5">
          <Button type="submit" size="sm" loading={renombrar.isPending} disabled={!name.trim()}>
            Guardar
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
            Cancelar
          </Button>
        </div>
      </form>
    </Card>
  );
}

function ConfirmarBorrado({
  nombre,
  cardCount,
  borrando,
  onConfirm,
  onCancel,
}: {
  nombre: string;
  cardCount: number;
  borrando: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/40 px-4">
      <div
        role="alertdialog"
        aria-labelledby="borrar-titulo"
        className="grid w-full max-w-md gap-3 rounded-panel bg-white p-7 shadow-lifted"
      >
        <h2 id="borrar-titulo" className="text-lg font-bold">
          ¿Eliminar «{nombre}»?
        </h2>
        <p className="text-sm text-body">Se borrarán también:</p>
        <ul className="ml-5 list-disc text-[13.5px] text-body">
          <li>
            sus {cardCount} {cardCount === 1 ? "tarjeta" : "tarjetas"}
          </li>
          <li>tu historial de repaso en este mazo</li>
          <li>el progreso que llevas en él</li>
        </ul>
        <p className="text-sm text-body">Esta acción no se puede deshacer.</p>

        <div className="mt-2 flex flex-wrap justify-end gap-2.5">
          <Button variant="ghost" onClick={onCancel} disabled={borrando}>
            Cancelar
          </Button>
          <Button
            loading={borrando}
            onClick={onConfirm}
            className="bg-coral hover:bg-coral/90"
          >
            Sí, eliminar
          </Button>
        </div>
      </div>
    </div>
  );
}
