/** Página de bienvenida (prototipo pp. 1-2). */

import { Link } from "react-router-dom";
import { Flame, Logo } from "../components/icons";
import { Button, LinkButton } from "../components/ui";

export function Landing() {
  return (
    <div className="min-h-dvh">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
        <span className="flex items-center gap-2.5 font-display text-lg font-bold">
          <Logo className="h-[30px] w-[30px]" />
          SkillPath
        </span>
        <LinkButton to="/entrar" variant="soft">
          Iniciar sesión
        </LinkButton>
      </header>

      <main className="mx-auto grid max-w-6xl items-center gap-12 px-5 pb-24 pt-10 sm:px-8 lg:grid-cols-2 lg:gap-16 lg:pt-20">
        <div className="animate-fade-up">
          <span className="inline-block rounded-full bg-mint px-3.5 py-1.5 text-[11.5px] font-bold uppercase tracking-[0.11em] text-mint-ink">
            Microlearning para mentes técnicas
          </span>

          {/* La escala sube solo cuando la columna da de sí: en un portátil
              típico, 52px rompería «Domina conceptos,» en dos líneas. */}
          <h1 className="mt-6 text-[36px] font-extrabold leading-[1.05] tracking-[-0.02em] sm:text-[44px] xl:text-[52px]">
            Domina conceptos,
            <br />
            un paso cada día.
          </h1>

          <p className="mt-5 max-w-lg text-[17px] leading-relaxed text-body">
            Flashcards inteligentes, rachas y quizzes para convertir lo que estudias en
            conocimiento que permanece.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <LinkButton to="/crear-cuenta">Crear cuenta gratis</LinkButton>
            <Button
              variant="soft"
              onClick={() =>
                document.getElementById("como-funciona")?.scrollIntoView({ behavior: "smooth" })
              }
            >
              Ver cómo funciona
            </Button>
          </div>
        </div>

        {/* Tarjeta de demostración: el mismo bloque oscuro del prototipo. */}
        <div className="rounded-panel bg-surface-dark p-6 shadow-lifted sm:p-8">
          <div className="flex items-center justify-between">
            <p className="text-lg font-semibold text-white">¡Hola, Lucía! 👋</p>
            <span className="flex items-center gap-1.5 text-sm font-bold text-mint-ink">
              <Flame className="h-4 w-4" />
              12 días
            </span>
          </div>

          <div className="mt-6 rounded-card bg-white p-6">
            <p className="text-[11.5px] font-bold uppercase tracking-[0.09em] text-brand">
              Estructuras de datos
            </p>
            <p className="mt-3 text-[19px] font-medium leading-snug">
              ¿Cuál es la complejidad de búsqueda en un árbol binario balanceado?
            </p>
            <Button className="mt-5" tabIndex={-1} aria-hidden="true">
              Ver respuesta
            </Button>
          </div>

          <p className="mt-5 text-sm text-white/60">+40 XP disponibles hoy · 6 minutos</p>
        </div>
      </main>

      <section id="como-funciona" className="border-t border-line bg-white px-5 py-20 sm:px-8">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-[28px] font-bold tracking-tight">Cómo funciona</h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {[
              {
                n: "01",
                title: "Elige tu tema",
                body: "Álgebra, estadística, programación, estructuras de datos… o crea tu propio mazo con los apuntes de clase.",
              },
              {
                n: "02",
                title: "Repasa unos minutos",
                body: "Cada tarjeta vuelve justo antes de que la olvides. Tú calificas qué tan bien la recordaste.",
              },
              {
                n: "03",
                title: "Comprueba tu dominio",
                body: "Un quiz de autoevaluación te dice qué conceptos ya dominas y cuáles conviene repasar.",
              },
            ].map((paso) => (
              <div key={paso.n}>
                <span className="font-display text-sm font-bold text-brand">{paso.n}</span>
                <h3 className="mt-2 text-lg font-bold">{paso.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-body">{paso.body}</p>
              </div>
            ))}
          </div>
          <div className="mt-12 text-center">
            <LinkButton to="/crear-cuenta">Empezar gratis</LinkButton>
          </div>
        </div>
      </section>

      <footer className="border-t border-line px-5 py-8 text-center text-[13px] text-body sm:px-8">
        <p>
          SkillPath — Proyecto del curso Cloud Computing ·{" "}
          <Link to="/entrar" className="text-brand hover:underline">
            Iniciar sesión
          </Link>
        </p>
      </footer>
    </div>
  );
}
