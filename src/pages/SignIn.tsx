/** Inicio de sesión (historia 10, prototipo p. 3). */

import { type FormEvent, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AuthShell } from "../components/AuthShell";
import { Button, Field, Input } from "../components/ui";
import { ApiError } from "../lib/api";
import { useAuth } from "../lib/auth";

export function SignIn() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const destino = (location.state as { from?: string } | null)?.from ?? "/inicio";

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await signIn(email, password);
      navigate(destino, { replace: true });
    } catch (err) {
      // El backend devuelve un mensaje genérico a propósito: no revela si
      // falló el correo o la contraseña (historia 10).
      setError(err instanceof ApiError ? err.message : "No pudimos iniciar sesión.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell
      title="Qué bueno verte de nuevo"
      subtitle="Continúa donde dejaste tu aprendizaje."
      footer={
        <>
          ¿Aún no tienes cuenta?{" "}
          <Link to="/crear-cuenta" className="font-semibold text-brand hover:underline">
            Regístrate
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="grid gap-4" noValidate>
        <Field label="Correo" htmlFor="email">
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="nombre@universidad.edu"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>

        <Field label="Contraseña" htmlFor="password">
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>

        {error && (
          <p className="rounded-[10px] bg-coral-soft px-3.5 py-2.5 text-[13px] text-coral" role="alert">
            {error}
          </p>
        )}

        <Button type="submit" loading={submitting} className="mt-1 w-full">
          Iniciar sesión
        </Button>
      </form>
    </AuthShell>
  );
}
