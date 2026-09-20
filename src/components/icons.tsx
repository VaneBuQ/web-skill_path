/** Iconos en línea. Los nombres coinciden con el campo `icon` del catálogo. */

type Props = { className?: string };

const base = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function Logo({ className = "h-8 w-8" }: Props) {
  return (
    <span className={`grid place-items-center rounded-[9px] bg-brand ${className}`}>
      <svg viewBox="0 0 16 16" className="h-[55%] w-[55%]" fill="none" aria-hidden="true">
        <path
          d="M3 2.5h7.5a2.5 2.5 0 0 1 2.5 2.5v8.5H5.5A2.5 2.5 0 0 1 3 11V2.5Z"
          stroke="white"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <path d="M6 6h4M6 9h2.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    </span>
  );
}

export function Flame({ className = "h-5 w-5" }: Props) {
  return (
    <svg viewBox="0 0 20 20" className={className} {...base} aria-hidden="true">
      <path d="M10 2.5s4 3.2 4 7a4 4 0 1 1-8 0c0-1.4.6-2.4 1.2-3.2.3 1 .9 1.7 1.6 1.7.9 0 1.2-.9 1.2-2 0-1.3-.5-2.4-1-3.5Z" />
    </svg>
  );
}

export function Sparkle({ className = "h-5 w-5" }: Props) {
  return (
    <svg viewBox="0 0 20 20" className={className} {...base} aria-hidden="true">
      <path d="M10 2.5 11.6 7 16 8.6 11.6 10.2 10 14.6 8.4 10.2 4 8.6 8.4 7 10 2.5Z" />
      <path d="M15.5 13.5 16 15l1.5.5-1.5.5-.5 1.5-.5-1.5-1.5-.5 1.5-.5.5-1.5Z" />
    </svg>
  );
}

export function Target({ className = "h-5 w-5" }: Props) {
  return (
    <svg viewBox="0 0 20 20" className={className} {...base} aria-hidden="true">
      <circle cx="10" cy="10" r="7" />
      <circle cx="10" cy="10" r="3.5" />
      <circle cx="10" cy="10" r="0.6" fill="currentColor" />
    </svg>
  );
}

export function Calendar({ className = "h-5 w-5" }: Props) {
  return (
    <svg viewBox="0 0 20 20" className={className} {...base} aria-hidden="true">
      <rect x="3" y="4.5" width="14" height="12" rx="2.5" />
      <path d="M3 8h14M7 3v3M13 3v3" />
    </svg>
  );
}

export function BookIcon({ className = "h-5 w-5" }: Props) {
  return (
    <svg viewBox="0 0 20 20" className={className} {...base} aria-hidden="true">
      <path d="M4 3.5h6.5A2.5 2.5 0 0 1 13 6v10.5H6.5A2.5 2.5 0 0 1 4 14V3.5Z" />
      <path d="M16 3.5v13" />
    </svg>
  );
}

export function Cards({ className = "h-5 w-5" }: Props) {
  return (
    <svg viewBox="0 0 20 20" className={className} {...base} aria-hidden="true">
      <rect x="2.5" y="4" width="15" height="12" rx="2.5" />
      <path d="M6 8h8M6 11.5h5" />
    </svg>
  );
}

export function QuestionIcon({ className = "h-5 w-5" }: Props) {
  return (
    <svg viewBox="0 0 20 20" className={className} {...base} aria-hidden="true">
      <circle cx="10" cy="10" r="7" />
      <path d="M8.2 8a1.9 1.9 0 1 1 2.6 1.8c-.5.2-.8.7-.8 1.2v.3" />
      <circle cx="10" cy="14" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function Trash({ className = "h-[18px] w-[18px]" }: Props) {
  return (
    <svg viewBox="0 0 18 18" className={className} {...base} strokeWidth={1.4} aria-hidden="true">
      <path d="M4 5h10M7.5 5V3.8h3V5M6 5l.6 9h4.8L12 5" />
    </svg>
  );
}

export function Plus({ className = "h-4 w-4" }: Props) {
  return (
    <svg viewBox="0 0 16 16" className={className} {...base} aria-hidden="true">
      <path d="M8 3.5v9M3.5 8h9" />
    </svg>
  );
}

export function Search({ className = "h-[18px] w-[18px]" }: Props) {
  return (
    <svg viewBox="0 0 20 20" className={className} {...base} aria-hidden="true">
      <circle cx="9" cy="9" r="5.5" />
      <path d="m13.2 13.2 3.3 3.3" />
    </svg>
  );
}

export function Atom({ className = "h-5 w-5" }: Props) {
  return (
    <svg viewBox="0 0 20 20" className={className} {...base} aria-hidden="true">
      <circle cx="10" cy="10" r="2" />
      <ellipse cx="10" cy="10" rx="7.5" ry="3.2" />
      <ellipse cx="10" cy="10" rx="7.5" ry="3.2" transform="rotate(60 10 10)" />
      <ellipse cx="10" cy="10" rx="7.5" ry="3.2" transform="rotate(120 10 10)" />
    </svg>
  );
}

export function BarChart({ className = "h-5 w-5" }: Props) {
  return (
    <svg viewBox="0 0 20 20" className={className} {...base} aria-hidden="true">
      <path d="M4.5 15V9M9.5 15V5M14.5 15v-4" />
    </svg>
  );
}

export function Database({ className = "h-5 w-5" }: Props) {
  return (
    <svg viewBox="0 0 20 20" className={className} {...base} aria-hidden="true">
      <ellipse cx="10" cy="5.5" rx="6" ry="2.5" />
      <path d="M4 5.5v9c0 1.4 2.7 2.5 6 2.5s6-1.1 6-2.5v-9M4 10c0 1.4 2.7 2.5 6 2.5s6-1.1 6-2.5" />
    </svg>
  );
}

export function Calculator({ className = "h-5 w-5" }: Props) {
  return (
    <svg viewBox="0 0 20 20" className={className} {...base} aria-hidden="true">
      <rect x="4.5" y="2.5" width="11" height="15" rx="2.5" />
      <path d="M7 6h6M7.5 10h.01M10 10h.01M12.5 10h.01M7.5 13.5h.01M10 13.5h.01M12.5 13.5h.01" />
    </svg>
  );
}

/** El catálogo trae una clave de icono; aquí se traduce al componente. */
const BY_NAME: Record<string, (props: Props) => JSX.Element> = {
  atom: Atom,
  "bar-chart": BarChart,
  "book-open": BookIcon,
  database: Database,
  calculator: Calculator,
};

export function TopicIcon({ name, className }: { name?: string | null; className?: string }) {
  const Component = (name && BY_NAME[name]) || Cards;
  return <Component className={className} />;
}
