/** Registro de cuenta (historia 9, prototipo p. 4). */

import { type FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthShell } from "../components/AuthShell";
import { Button, Field, Input } from "../components/ui";
import { ApiError } from "../lib/api";
import { useAuth } from "../lib/auth";

const PASSWORD_MIN = 8;

export function SignUp() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const passwordCorta = password.length > 0 && password.length < PASSWORD_MIN;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await signUp(name, email, password);
      // Historia 9: tras crear la cuenta se redirige a la página principal.
      // El registro ya devuelve el token, así que no hay que iniciar sesión.
      navigate("/inicio", { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No pudimos crear tu cuenta.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell
      title="Empieza tu ruta"
      subtitle="Crea tu cuenta y aprende a tu ritmo."
      footer={
        <>
          ¿Ya tienes cuenta?{" "}
          <Link to="/entrar" className="font-semibold text-brand hover:underline">
            Inicia sesión
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="grid gap-4" noValidate>
        <Field label="Nombre" htmlFor="name">
          <Input
            id="name"
            name="name"
            autoComplete="name"
            required
            placeholder="Tu nombre"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </Field>

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

        <Field
          label="Contraseña"
          htmlFor="password"
          hint={`(mínimo ${PASSWORD_MIN} caracteres)`}
          error={passwordCorta ? `Necesita al menos ${PASSWORD_MIN} caracteres.` : null}
        >
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={PASSWORD_MIN}
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

        <Button
          type="submit"
          loading={submitting}
          disabled={!name || !email || password.length < PASSWORD_MIN}
          className="mt-1 w-full"
        >
          Crear cuenta
        </Button>
      </form>
    </AuthShell>
  );
}
