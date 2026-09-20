/**
 * «Repasar hoy» del Home lleva aquí: elegir con qué tema repasar.
 *
 * El repaso es por tema, así que el acceso global del Home necesita un paso
 * intermedio cuando el usuario sigue más de uno.
 */

import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { TopicIcon } from "../components/icons";
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

export function ReviewPicker() {
  const topics = useQuery({ queryKey: ["my-topics"], queryFn: api.myTopics });
  const progress = useQuery({ queryKey: ["progress"], queryFn: api.progress });

  if (topics.isLoading) return <Loading />;
  if (topics.isError) {
    return <ErrorState message="No pudimos cargar tus temas." onRetry={topics.refetch} />;
  }

  const pendientesPorTema = new Map(
    (progress.data?.items ?? []).map((item) => [item.topicId, item.cardsPending]),
  );
  const temas = topics.data!.items;

  return (
    <div className="grid gap-6">
      <PageHeader title="Repasar hoy" subtitle="Elige con qué tema quieres empezar." />

      {temas.length === 0 ? (
        <EmptyState
          title="Todavía no sigues ningún tema"
          description="Agrega uno del catálogo o crea tu propio mazo para empezar a repasar."
          action={<LinkButton to="/explorar">Explorar temas</LinkButton>}
        />
      ) : (
        <div className="grid gap-3">
          {temas.map((tema) => {
            const pendientes = pendientesPorTema.get(tema.topicId);
            return (
              <Link key={tema.topicId} to={`/repasar/${tema.topicId}`}>
                <Card className="flex items-center gap-4 p-4 transition-colors hover:border-brand/40 sm:p-5">
                  <span className="grid h-10 w-10 flex-none place-items-center rounded-[11px] bg-brand-soft text-brand">
                    <TopicIcon name={tema.icon} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2 font-bold">
                      <span className="truncate">{tema.name}</span>
                      {tema.isOwn && <Tag>Propio</Tag>}
                    </p>
                    <p className="mt-0.5 text-[13px] text-body">
                      {pendientes === undefined
                        ? `${tema.cardCount} conceptos`
                        : `${pendientes} por dominar de ${tema.cardCount}`}
                    </p>
                  </div>
                  <span className="flex-none text-sm font-semibold text-brand">Repasar →</span>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
