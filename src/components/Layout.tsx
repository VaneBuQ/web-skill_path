/** Cabecera y contenedor de las páginas con sesión iniciada. */

import { useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { Logo } from "./icons";
import { cx } from "./ui";

// El orden sigue el recorrido de estudio: elegir tema, repasarlo, comprobar
// con el quiz. «Inicio» no está porque el logo ya lleva ahí.
const NAV = [
  { to: "/explorar", label: "Explorar" },
  { to: "/repasar", label: "Repasar" },
  { to: "/quiz", label: "Quiz" },
  { to: "/mis-mazos", label: "Mis mazos" },
  { to: "/progreso", label: "Mi progreso" },
  { to: "/configuracion", label: "Configuración" },
];

function navClass({ isActive }: { isActive: boolean }): string {
  return cx(
    "whitespace-nowrap text-sm transition-colors",
    isActive ? "font-semibold text-brand" : "text-body hover:text-ink",
  );
}

export function Header() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  function handleSignOut() {
    signOut();
    navigate("/");
  }

  return (
    <header className="border-b border-line bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3.5 sm:px-6">
        <Link to="/inicio" className="flex items-center gap-2.5 font-display text-lg font-bold">
          <Logo className="h-[30px] w-[30px]" />
          SkillPath
        </Link>

        <nav className="hidden items-center gap-6 lg:flex">
          {NAV.map((item) => (
            <NavLink key={item.to} to={item.to} className={navClass}>
              {item.label}
            </NavLink>
          ))}
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 text-sm text-body transition-colors hover:text-ink"
          >
            <span className="grid h-8 w-8 place-items-center rounded-full bg-mint text-[11.5px] font-bold text-mint-ink">
              {user?.initials ?? "?"}
            </span>
            Salir
          </button>
        </nav>

        <button
          className="lg:hidden"
          onClick={() => setMenuOpen((open) => !open)}
          aria-expanded={menuOpen}
          aria-label="Abrir menú"
        >
          <svg viewBox="0 0 20 20" className="h-6 w-6 text-body" fill="none" aria-hidden="true">
            <path d="M4 6h12M4 10h12M4 14h12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {menuOpen && (
        <nav className="grid gap-1 border-t border-line px-4 py-3 lg:hidden">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) =>
                cx(
                  "rounded-[10px] px-3 py-2 text-sm",
                  isActive ? "bg-brand-soft font-semibold text-brand" : "text-body",
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
          <button
            onClick={handleSignOut}
            className="rounded-[10px] px-3 py-2 text-left text-sm text-body"
          >
            Cerrar sesión
          </button>
        </nav>
      )}
    </header>
  );
}

export function AppLayout() {
  return (
    <div className="min-h-dvh">
      <Header />
      <main className="mx-auto max-w-5xl px-4 pb-20 pt-8 sm:px-6">
        <Outlet />
      </main>
    </div>
  );
}

/** Marco angosto de las pantallas de estudio, sin la navegación completa. */
export function FocusLayout() {
  return (
    <div className="min-h-dvh">
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3.5 sm:px-6">
          <Link to="/inicio" className="flex items-center gap-2.5 font-display text-lg font-bold">
            <Logo className="h-[30px] w-[30px]" />
            SkillPath
          </Link>
          <Link to="/inicio" className="text-sm text-body transition-colors hover:text-ink">
            Salir de la sesión
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-4 pb-20 pt-7 sm:px-6">
        <Outlet />
      </main>
    </div>
  );
}
