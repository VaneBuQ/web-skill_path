/** Página principal «Tu ruta de hoy» (historia 11, prototipo pp. 5-6). */

import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  BookIcon,
  Calendar,
  Flame,
  QuestionIcon,
  Sparkle,
  Target,
  TopicIcon,
} from "../components/icons";
import {
  Card,
  EmptyState,
  ErrorState,
  LinkButton,
  Loading,
  PageHeader,
  ProgressBar,
  Tag,
} from "../components/ui";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";
import { formatNumber } from "../lib/format";

const ACCESOS = [
  { to: "/repasar", label: "Repasar hoy", Icon: Calendar },
  { to: "/mis-mazos", label: "Mis mazos", Icon: BookIcon },
  { to: "/progreso", label: "Mi progreso", Icon: Target },
  { to: "/quiz", label: "Quiz", Icon: QuestionIcon },
];

export function Home() {
  const { user } = useAuth();

  // Dos llamadas en paralelo: el catálogo de «Mis temas» es de topics-service
  // y los porcentajes son de progress-service. Se unen por topicId.
  const topics = useQuery({ queryKey: ["my-topics"], queryFn: api.myTopics });
  const progress = useQuery({ queryKey: ["progress"], queryFn: api.progress });

  if (topics.isLoading || progress.isLoading) return <Loading />;
  if (topics.isError || progress.isError) {
    return (
      <ErrorState
        message="No pudimos cargar tu ruta de hoy."
        onRetry={() => {
          topics.refetch();
          progress.refetch();
        }}
      />
    );
  }

  const porTema = new Map(progress.data!.items.map((item) => [item.topicId, item]));
  const summary = progress.data!.summary;
  const misTemas = topics.data!.items;

  return (
    <div className="grid gap-7">
      <PageHeader
        title={`Tu ruta de hoy${user ? `, ${user.name.split(" ")[0]}` : ""}`}
        subtitle="Un poco cada día hace una gran diferencia."
        action={<LinkButton to="/explorar">+ Explorar temas</LinkButton>}
      />

      {/* Racha y XP — historia 5 */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Stat
          icon={<Flame className="h-5 w-5" />}
          value={`${summary.streakDays} ${summary.streakDays === 1 ? "día" : "días"}`}
          label="Racha actual"
        />
        <Stat
          icon={<Sparkle className="h-5 w-5" />}
          value={`${formatNumber(summary.xpTotal)} XP`}
          label="Experiencia total"
        />
      </div>

      {summary.streakDays === 0 && summary.xpTotal > 0 && (
        <p className="rounded-card bg-brand-soft px-4 py-3 text-sm text-brand">
          Tu racha se reinició. Repasa una tarjeta hoy para empezar de nuevo.
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {ACCESOS.map(({ to, label, Icon }) => (
          <Link
            key={to}
            to={to}
            className="group rounded-card border border-line bg-white p-4 transition-colors hover:border-brand/40"
          >
            <Icon className="h-5 w-5 text-brand" />
            <p className="mt-6 text-sm font-bold group-hover:text-brand">{label}</p>
          </Link>
        ))}
      </div>

      <section className="grid gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Mis temas</h2>
          {misTemas.length > 0 && (
            <Link to="/progreso" className="text-sm font-semibold text-brand hover:underline">
              Ver todos
            </Link>
          )}
        </div>

        {misTemas.length === 0 ? (
          <EmptyState
            title="Todavía no sigues ningún tema"
            description="Elige uno del catálogo o crea tu propio mazo con los apuntes de clase."
            action={<LinkButton to="/explorar">Explorar temas</LinkButton>}
          />
        ) : (
          <div className="grid gap-3">
            {misTemas.map((tema) => {
              const avance = porTema.get(tema.topicId);
              const percent = avance?.percent ?? 0;
              const dominados = avance?.cardsMastered ?? 0;

              return (
                <Link key={tema.topicId} to={`/repasar/${tema.topicId}`}>
                  <Card className="p-4 transition-colors hover:border-brand/40 sm:p-5">
                    <div className="flex items-center gap-4">
                      <span className="grid h-10 w-10 flex-none place-items-center rounded-[11px] bg-brand-soft text-brand">
                        <TopicIcon name={tema.icon} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="flex items-center gap-2 font-bold">
                          <span className="truncate">{tema.name}</span>
                          {tema.isOwn && <Tag>Propio</Tag>}
                        </p>
                        <p className="mt-0.5 text-[13px] text-body">
                          {dominados} de {tema.cardCount} conceptos
                        </p>
                      </div>
                      <span className="flex-none text-sm font-bold text-brand">{percent}%</span>
                    </div>
                    <ProgressBar percent={percent} className="mt-3.5" />
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </section>
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
      <div>
        <p className="text-xl font-bold tabular-nums">{value}</p>
        <p className="text-[13px] text-body">{label}</p>
      </div>
    </Card>
  );
}
