/**
 * Configuración de las URLs de los microservicios.
 *
 * Cada microservicio despliega su propio API Gateway, así que hacen falta
 * seis URLs. Se pegan aquí después de desplegar y quedan guardadas en el
 * navegador, igual que en el proyecto de ejemplo.
 */

import { type FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Logo } from "../components/icons";
import { Button, Card, Field, Input, PageHeader, cx } from "../components/ui";
import { type PingResult, ping } from "../lib/api";
import {
  SERVICES,
  type ApiConfig,
  type ServiceKey,
  isConfigured,
  loadConfig,
  refreshConfig,
  saveConfig,
} from "../lib/config";

const EJEMPLO = "https://abc123xyz.execute-api.us-east-1.amazonaws.com";

/** Cómo se explica cada resultado de la sonda, sin jerga de HTTP. */
function explicar(r: PingResult): { ok: boolean; texto: string } {
  switch (r.estado) {
    case "ok":
      return { ok: true, texto: "Responde correctamente" };
    case "sin-url":
      return { ok: false, texto: "Falta la URL" };
    case "inalcanzable":
      return { ok: false, texto: "No responde: revisa que la URL esté bien copiada" };
    case "ruta-desconocida":
      return { ok: false, texto: "Responde, pero es la URL de otro microservicio" };
  }
}

export function Settings({ standalone = false }: { standalone?: boolean }) {
  const navigate = useNavigate();
  const [config, setConfig] = useState<ApiConfig>(loadConfig);
  const [saved, setSaved] = useState(false);
  const [prueba, setPrueba] = useState<Partial<Record<ServiceKey, PingResult>> | null>(null);
  const [probando, setProbando] = useState(false);

  const completo = isConfigured(config);

  /**
   * Comprueba las seis URLs de una vez.
   *
   * Pegar seis URLs parecidas y equivocarse en una deja la aplicación medio
   * rota en silencio —el progreso deja de guardarse, el quiz no arranca—, así
   * que conviene poder verlo aquí en lugar de deducirlo pantalla por pantalla.
   */
  async function probar() {
    saveConfig(config);
    refreshConfig();
    setProbando(true);
    setPrueba(null);
    const entradas = await Promise.all(
      SERVICES.map(async ({ key }) => [key, await ping(key)] as const),
    );
    setPrueba(Object.fromEntries(entradas));
    setProbando(false);
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    saveConfig(config);
    refreshConfig();
    setSaved(true);
    if (completo) navigate("/", { replace: true });
  }

  const contenido = (
    <form onSubmit={handleSubmit} className="grid gap-5">
      <Card className="grid gap-4 p-5 sm:p-6">
        {SERVICES.map(({ key, label, hint }) => (
          <Field key={key} label={label} hint={`— ${hint}`} htmlFor={`api-${key}`}>
            <Input
              id={`api-${key}`}
              type="url"
              inputMode="url"
              autoComplete="off"
              spellCheck={false}
              placeholder={EJEMPLO}
              value={config[key]}
              onChange={(e) => {
                setConfig({ ...config, [key]: e.target.value });
                setSaved(false);
              }}
            />
          </Field>
        ))}

        {saved && (
          <p className="rounded-[10px] bg-mint px-3.5 py-2.5 text-[13px] text-mint-ink" role="status">
            Configuración guardada.
          </p>
        )}

        {!completo && (
          <p className="text-[13px] text-body">
            Faltan {SERVICES.filter((s) => !config[s.key]).length} de {SERVICES.length} URLs.
            Las obtienes al desplegar cada microservicio con <code>serverless deploy</code>.
          </p>
        )}

        {prueba && (
          <ul className="grid gap-1.5 rounded-[10px] border border-line p-3.5">
            {SERVICES.map(({ key, label }) => {
              const r = prueba[key];
              if (!r) return null;
              const { ok, texto } = explicar(r);
              return (
                <li key={key} className="flex items-baseline gap-2 text-[13px]">
                  <span aria-hidden="true" className={ok ? "text-mint-ink" : "text-coral"}>
                    {ok ? "✓" : "✗"}
                  </span>
                  <span className="font-semibold">{label}</span>
                  <span className={cx(ok ? "text-body" : "font-medium text-coral")}>{texto}</span>
                </li>
              );
            })}
          </ul>
        )}

        <div className="flex flex-wrap gap-2.5">
          <Button type="submit">Guardar configuración</Button>
          <Button type="button" variant="ghost" loading={probando} onClick={probar}>
            Probar conexión
          </Button>
        </div>
      </Card>
    </form>
  );

  if (!standalone) {
    return (
      <div className="grid gap-6">
        <PageHeader
          title="Configuración"
          subtitle="URLs de los microservicios desplegados en AWS."
        />
        {contenido}
      </div>
    );
  }

  // Primera vez: aún no hay sesión ni navegación, así que se muestra sola.
  return (
    <div className="mx-auto grid min-h-dvh max-w-2xl gap-6 px-4 py-12 sm:px-6">
      <div className="flex items-center gap-2.5 font-display text-lg font-bold">
        <Logo className="h-[30px] w-[30px]" />
        SkillPath
      </div>
      <PageHeader
        title="Conecta con tus APIs"
        subtitle="Pega la URL de invocación de cada microservicio. Las obtienes al desplegarlos."
      />
      {contenido}
      <p className="text-[13px] leading-relaxed text-body">
        Cada microservicio de SkillPath se despliega por separado y crea su propio API
        Gateway, así que cada uno tiene su propia URL. Se guardan en este navegador; si
        vuelves a desplegar, actualízalas aquí.
      </p>
    </div>
  );
}
