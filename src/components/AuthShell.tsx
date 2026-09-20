/** Marco de las pantallas de login y registro (prototipo pp. 3-4). */

import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Logo } from "./icons";

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <div className="grid min-h-dvh place-items-center px-4 py-12">
      <div className="w-full max-w-[400px]">
        <Link to="/" className="mb-8 flex items-center justify-center gap-2.5 font-display text-xl font-bold">
          <Logo className="h-9 w-9" />
          SkillPath
        </Link>

        <div className="rounded-panel border border-line bg-white p-7 shadow-card">
          <h1 className="text-[22px] font-bold tracking-tight">{title}</h1>
          <p className="mt-1 text-sm text-body">{subtitle}</p>
          <div className="mt-6">{children}</div>
        </div>

        <p className="mt-5 text-center text-sm text-body">{footer}</p>
      </div>
    </div>
  );
}
