/** Crear mazo (historia 8). */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { type FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Trash } from "../components/icons";
import { Button, Card, Field, Input, PageHeader, Textarea } from "../components/ui";
import { ApiError, api } from "../lib/api";
import type { NewCard } from "../lib/types";

const NAME_MAX = 60;
const DESCRIPTION_MAX = 200;
const MAX_CARDS = 50;

type Borrador = { question: string; answer: string; hint: string };

const VACIA: Borrador = { question: "", answer: "", hint: "" };

export function DeckNew() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [cards, setCards] = useState<Borrador[]>([{ ...VACIA }]);

  const completas = cards.filter((c) => c.question.trim() && c.answer.trim());
  // Criterio de aceptación: nombre y al menos una tarjeta con pregunta y respuesta.
  const puedeGuardar = name.trim().length > 0 && completas.length > 0;

  const crear = useMutation({
    mutationFn: () => {
      const payload: NewCard[] = completas.map((c) => ({
        question: c.question.trim(),
        answer: c.answer.trim(),
        hint: c.hint.trim() || null,
      }));
      return api.createDeck(name.trim(), description.trim() || null, payload);
    },
    onSuccess: (mazo) => {
      queryClient.invalidateQueries({ queryKey: ["my-decks"] });
      queryClient.invalidateQueries({ queryKey: ["my-topics"] });
      navigate(`/mis-mazos/${mazo.topicId}`, { replace: true });
    },
  });

  function actualizar(index: number, campo: keyof Borrador, valor: string) {
    setCards((prev) =>
      prev.map((card, i) => (i === index ? { ...card, [campo]: valor } : card)),
    );
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (puedeGuardar) crear.mutate();
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-6">
      <PageHeader title="Crear mazo" subtitle="Ponle un nombre y agrega tus primeras tarjetas." />

      <Card className="grid gap-4 p-5 sm:p-6">
        <Field label="Nombre del mazo" htmlFor="deck-name">
          <Input
            id="deck-name"
            value={name}
            maxLength={NAME_MAX}
            required
            placeholder="Ej. Apuntes de Estadística — semana 4"
            onChange={(e) => setName(e.target.value)}
          />
        </Field>

        <Field label="Descripción" hint="(opcional)" htmlFor="deck-description">
          <Textarea
            id="deck-description"
            value={description}
            maxLength={DESCRIPTION_MAX}
            placeholder="¿De qué clase salieron estas tarjetas?"
            onChange={(e) => setDescription(e.target.value)}
          />
        </Field>

        <div className="grid gap-3">
          <p className="text-[13px] font-semibold">Tarjetas</p>

          {cards.map((card, index) => (
            <div key={index} className="grid gap-3 rounded-card border border-line bg-canvas p-4">
              <div className="flex items-center justify-between">
                <span className="text-[11.5px] font-bold uppercase tracking-[0.06em] text-brand">
                  Tarjeta {index + 1}
                </span>
                {cards.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setCards((prev) => prev.filter((_, i) => i !== index))}
                    aria-label={`Quitar tarjeta ${index + 1}`}
                    className="rounded-lg p-1.5 text-body transition-colors hover:bg-coral-soft hover:text-coral"
                  >
                    <Trash />
                  </button>
                )}
              </div>

              <Field label="Pregunta" htmlFor={`q-${index}`}>
                <Textarea
                  id={`q-${index}`}
                  value={card.question}
                  placeholder="¿Qué concepto quieres recordar?"
                  onChange={(e) => actualizar(index, "question", e.target.value)}
                />
              </Field>

              <Field label="Respuesta" htmlFor={`a-${index}`}>
                <Textarea
                  id={`a-${index}`}
                  value={card.answer}
                  placeholder="La explicación que quieres memorizar"
                  onChange={(e) => actualizar(index, "answer", e.target.value)}
                />
              </Field>

              <Field label="Pista de memoria" hint="(opcional)" htmlFor={`h-${index}`}>
                <Input
                  id={`h-${index}`}
                  value={card.hint}
                  placeholder="Algo que te ayude a recordarlo"
                  onChange={(e) => actualizar(index, "hint", e.target.value)}
                />
              </Field>
            </div>
          ))}

          <Button
            type="button"
            variant="soft"
            size="sm"
            className="justify-self-start"
            disabled={cards.length >= MAX_CARDS}
            onClick={() => setCards((prev) => [...prev, { ...VACIA }])}
          >
            <Plus />
            Agregar tarjeta
          </Button>
        </div>

        {crear.isError && (
          <p className="rounded-[10px] bg-coral-soft px-3.5 py-2.5 text-[13px] text-coral" role="alert">
            {crear.error instanceof ApiError
              ? crear.error.message
              : "No pudimos guardar el mazo."}
          </p>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
          <p className="text-[13px] text-body tabular-nums">
            {completas.length} {completas.length === 1 ? "tarjeta lista" : "tarjetas listas"}
          </p>
          <div className="flex gap-2.5">
            <Button type="button" variant="ghost" onClick={() => navigate("/mis-mazos")}>
              Cancelar
            </Button>
            <Button type="submit" disabled={!puedeGuardar} loading={crear.isPending}>
              Guardar mazo
            </Button>
          </div>
        </div>
      </Card>
    </form>
  );
}
