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
import { Button, Card, Field, Input, PageHeader } from "../components/ui";
import {
  SERVICES,
  type ApiConfig,
  isConfigured,
  loadConfig,
  refreshConfig,
  saveConfig,
} from "../lib/config";

const EJEMPLO = "https://abc123xyz.execute-api.us-east-1.amazonaws.com";

export function Settings({ standalone = false }: { standalone?: boolean }) {
  const navigate = useNavigate();
  const [config, setConfig] = useState<ApiConfig>(loadConfig);
  const [saved, setSaved] = useState(false);

  const completo = isConfigured(config);

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

        <Button type="submit" className="justify-self-start">
          Guardar configuración
        </Button>
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
