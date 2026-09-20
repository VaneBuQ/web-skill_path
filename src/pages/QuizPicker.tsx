/** El acceso «Quiz» del Home: elegir el tema sobre el que autoevaluarse. */

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
} from "../components/ui";
import { api } from "../lib/api";

export function QuizPicker() {
  const topics = useQuery({ queryKey: ["my-topics"], queryFn: api.myTopics });

  if (topics.isLoading) return <Loading />;
  if (topics.isError) {
    return <ErrorState message="No pudimos cargar tus temas." onRetry={topics.refetch} />;
  }

  const temas = topics.data!.items;

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Pon a prueba lo que sabes"
        subtitle="Elige un tema con al menos 10 conceptos estudiados."
      />

      {temas.length === 0 ? (
        <EmptyState
          title="Todavía no sigues ningún tema"
          description="Agrega un tema y estudia sus conceptos para poder autoevaluarte."
          action={<LinkButton to="/explorar">Explorar temas</LinkButton>}
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {temas.map((tema) => (
            <Link key={tema.topicId} to={`/quiz/${tema.topicId}`}>
              <Card className="flex items-center gap-4 p-5 transition-colors hover:border-brand/40">
                <span className="grid h-10 w-10 flex-none place-items-center rounded-[11px] bg-brand-soft text-brand">
                  <TopicIcon name={tema.icon} />
                </span>
                <div className="min-w-0">
                  <p className="truncate font-bold">{tema.name}</p>
                  <p className="text-[13px] text-body">{tema.cardCount} conceptos</p>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
