/** Mi progreso (historia 4, prototipo p. 11). */

import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { BookIcon, Calendar, Target } from "../components/icons";
import {
  Card,
  EmptyState,
  ErrorState,
  LinkButton,
  Loading,
  PageHeader,
  ProgressBar,
} from "../components/ui";
import { api } from "../lib/api";
import { formatDate, formatRelativeDate } from "../lib/format";

export function Progress() {
  const progress = useQuery({ queryKey: ["progress"], queryFn: api.progress });

  if (progress.isLoading) return <Loading />;
  if (progress.isError) {
    return <ErrorState message="No pudimos cargar tu progreso." onRetry={progress.refetch} />;
  }

  const { summary, items } = progress.data!;

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Mi progreso"
        subtitle="Conceptos dominados, pendientes y tu actividad reciente."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat
          icon={<Target className="h-5 w-5" />}
          value={`${summary.masteryPercent}%`}
          label="Dominio global"
        />
        <Stat
          icon={<Calendar className="h-5 w-5" />}
          value={formatRelativeDate(summary.lastStudiedAt)}
          label="Último repaso"
        />
        <Stat
          icon={<BookIcon className="h-5 w-5" />}
          value={String(summary.cardsMastered)}
          label="Conceptos dominados"
        />
      </div>

      {items.length === 0 ? (
        <EmptyState
          title="Todavía no hay nada que medir"
          description="Repasa tus primeras tarjetas y aquí verás cuánto dominas de cada tema."
          action={<LinkButton to="/repasar">Empezar a repasar</LinkButton>}
        />
      ) : (
        <div className="grid gap-3">
          {items.map((tema) => (
            <Card key={tema.topicId} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <Link
                    to={`/repasar/${tema.topicId}`}
                    className="text-lg font-semibold hover:text-brand"
                  >
                    {tema.topicName ?? tema.topicId}
                  </Link>
                  <p className="mt-0.5 text-[13px] text-body">
                    {tema.percent}% dominado · {tema.cardsPending}{" "}
                    {tema.cardsPending === 1 ? "pendiente" : "pendientes"}
                  </p>
                </div>
                <p className="text-[13px] text-body">
                  Último repaso · {formatDate(tema.lastStudiedAt)}
                </p>
              </div>
              <ProgressBar percent={tema.percent} className="mt-3.5" />
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
}) {
  return (
    <Card className="flex items-center gap-4 p-5">
      <span className="grid h-11 w-11 flex-none place-items-center rounded-full bg-mint text-mint-ink">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="truncate text-xl font-bold tabular-nums">{value}</p>
        <p className="text-[13px] text-body">{label}</p>
      </div>
    </Card>
  );
}
