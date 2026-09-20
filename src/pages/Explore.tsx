/** Explorar temas (historia 1, prototipo p. 7). */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Search, TopicIcon } from "../components/icons";
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  Input,
  Loading,
  PageHeader,
} from "../components/ui";
import { ApiError, api } from "../lib/api";

export function Explore() {
  const [search, setSearch] = useState("");
  const [mensaje, setMensaje] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const catalogo = useQuery({
    queryKey: ["topics", search],
    queryFn: () => api.topics(search || undefined),
  });
  const misTemas = useQuery({ queryKey: ["my-topics"], queryFn: api.myTopics });

  const seguir = useMutation({
    mutationFn: (topicId: string) => api.followTopic(topicId),
    onSuccess: (result) => {
      setMensaje(
        result.alreadyFollowing
          ? `«${result.name}» ya estaba en Mis temas.`
          : `«${result.name}» se agregó con ${result.cardCount} conceptos.`,
      );
      queryClient.invalidateQueries({ queryKey: ["my-topics"] });
    },
    onError: (error) => {
      setMensaje(error instanceof ApiError ? error.message : "No pudimos agregar el tema.");
    },
  });

  const seguidos = new Set(misTemas.data?.items.map((t) => t.topicId) ?? []);

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Elige tu próximo tema"
        subtitle="Agrega una ruta a «Mis temas» y empieza con sesiones de 5 minutos."
      />

      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-body" />
        <Input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar temas"
          aria-label="Buscar temas"
          className="py-3 pl-11"
        />
      </div>

      {mensaje && (
        <p className="rounded-card bg-mint px-4 py-3 text-sm text-mint-ink" role="status">
          {mensaje}
        </p>
      )}

      {catalogo.isLoading ? (
        <Loading />
      ) : catalogo.isError ? (
        <ErrorState message="No pudimos cargar el catálogo." onRetry={catalogo.refetch} />
      ) : catalogo.data!.items.length === 0 ? (
        <EmptyState
          title="Sin resultados"
          description={`No encontramos temas que coincidan con «${search}».`}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {catalogo.data!.items.map((tema) => {
            const yaSeguido = seguidos.has(tema.topicId);
            return (
              <Card key={tema.topicId} className="flex flex-col gap-3 p-5">
                <span className="text-brand">
                  <TopicIcon name={tema.icon} className="h-6 w-6" />
                </span>
                <div className="flex-1">
                  <h2 className="text-lg font-bold">{tema.name}</h2>
                  <p className="mt-0.5 text-[13px] text-body">{tema.cardCount} conceptos</p>
                  {tema.description && (
                    <p className="mt-2 text-[13px] leading-relaxed text-body">{tema.description}</p>
                  )}
                </div>
                <Button
                  variant="soft"
                  size="sm"
                  className="self-start"
                  disabled={yaSeguido}
                  loading={seguir.isPending && seguir.variables === tema.topicId}
                  onClick={() => seguir.mutate(tema.topicId)}
                >
                  {yaSeguido ? "Ya está en Mis temas" : "Agregar a Mis temas"}
                </Button>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
