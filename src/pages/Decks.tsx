/** Mis mazos (historia 8). Prototipo: docs/prototipo-mazos-propios.html */

import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Cards, Plus } from "../components/icons";
import {
  Card,
  EmptyState,
  ErrorState,
  LinkButton,
  Loading,
  PageHeader,
  Tag,
} from "../components/ui";
import { api } from "../lib/api";
import { formatDate } from "../lib/format";

export function Decks() {
  const decks = useQuery({ queryKey: ["my-decks"], queryFn: api.myDecks });

  if (decks.isLoading) return <Loading />;
  if (decks.isError) {
    return <ErrorState message="No pudimos cargar tus mazos." onRetry={decks.refetch} />;
  }

  const mazos = decks.data!.items;

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Mis mazos"
        subtitle="Tarjetas que creaste a partir de tus apuntes."
        action={
          mazos.length > 0 ? (
            <LinkButton to="/mis-mazos/nuevo">
              <Plus />
              Crear mazo
            </LinkButton>
          ) : undefined
        }
      />

      {mazos.length === 0 ? (
        <EmptyState
          icon={<Cards className="h-10 w-10 text-line" />}
          title="Todavía no tienes mazos propios"
          description="Crea uno con las preguntas que tú quieras y estúdialo junto a los demás temas."
          action={
            <LinkButton to="/mis-mazos/nuevo">
              <Plus />
              Crear mi primer mazo
            </LinkButton>
          }
        />
      ) : (
        <div className="grid gap-3">
          {mazos.map((mazo) => (
            <Card key={mazo.topicId} className="p-4 sm:p-5">
              <div className="flex flex-wrap items-center gap-4">
                <span className="grid h-10 w-10 flex-none place-items-center rounded-[11px] bg-brand-soft text-brand">
                  <Cards />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2 font-bold">
                    <span className="truncate">{mazo.name}</span>
                    <Tag>Propio</Tag>
                  </p>
                  <p className="mt-0.5 text-[13px] text-body">
                    {mazo.cardCount} {mazo.cardCount === 1 ? "concepto" : "conceptos"} · creado el{" "}
                    {formatDate(mazo.createdAt)}
                  </p>
                </div>
                <div className="flex w-full flex-none gap-2 sm:w-auto">
                  <Link
                    to={`/mis-mazos/${mazo.topicId}`}
                    className="flex-1 rounded-full bg-brand-soft px-4 py-2 text-center text-[13px] font-semibold text-brand transition-colors hover:bg-brand-softer sm:flex-none"
                  >
                    Editar
                  </Link>
                  <Link
                    to={`/repasar/${mazo.topicId}`}
                    className="flex-1 rounded-full border border-line px-4 py-2 text-center text-[13px] font-semibold text-body transition-colors hover:bg-canvas sm:flex-none"
                  >
                    Repasar
                  </Link>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
