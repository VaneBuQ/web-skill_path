# SkillPath — Web (Frontend)

Aplicación web de **microlearning activo** para personas que están cursando una
especialización, bootcamp, maestría o materia universitaria (álgebra, estadística,
programación, estructuras de datos, etc.). Permite estudiar con flashcards y repetición
espaciada, crear mazos propios a partir de los apuntes de clase, autoevaluarse con
quizzes y seguir el progreso por tema.

Curso **Cloud Computing** — Maestría en Ciencia de Datos e Inteligencia Artificial
(CDIA V5), UTEC Posgrado. Docente: Oscar Mejía.

Backend: [api-skill_path](https://github.com/VaneBuQ/api-skill_path)

## Funcionalidades (MVP)

- [x] Registro de cuenta (correo y contraseña) — *historia 9*
- [x] Inicio de sesión — *historia 10*
- [x] Página principal con racha, XP, temas activos y accesos directos — *historia 11*
- [x] Explorar el catálogo y seguir un tema — *historia 1*
- [x] Estudiar tarjetas de repaso — *historia 2*
- [x] Calificar el repaso (Olvidé / Difícil / Fácil) — *historia 3*
- [x] Ver el progreso por tema — *historia 4*
- [x] Ver racha y XP — *historia 5*
- [x] Quiz de autoevaluación — *historia 6*
- [x] Crear mi propio mazo — *historia 8*

Fuera de alcance: historia 7 (suscripción premium).

## Tecnologías

- **React 18** + **TypeScript** + **Vite 6**
- **Tailwind CSS**, con los tokens del prototipo de Figma en `tailwind.config.js`
- **React Router** para la navegación y las rutas protegidas
- **TanStack Query** para las llamadas a la API, su caché y sus estados
- **Vitest** + **Testing Library** para las pruebas

## Estructura

```
web-skill_path/
├── src/
│   ├── lib/
│   │   ├── api.ts          # cliente tipado de los 21 endpoints
│   │   ├── types.ts        # tipos que espejan las respuestas del backend
│   │   ├── auth.tsx        # sesión: token, rehidratación y cierre
│   │   └── format.ts       # fechas, números y reloj del quiz
│   ├── components/
│   │   ├── ui.tsx          # botones, campos, estados de carga/error/vacío
│   │   ├── icons.tsx       # iconos en línea
│   │   ├── Layout.tsx      # cabecera y marcos de página
│   │   └── AuthShell.tsx   # marco de login y registro
│   ├── pages/              # una por pantalla del prototipo
│   ├── test/               # pruebas de componentes y del cliente
│   ├── App.tsx             # rutas
│   └── main.tsx
├── .env.example
└── tailwind.config.js
```

## Instalación y ejecución local

```bash
npm install
```

```bash
cp .env.example .env
```

Edita `.env` con la URL de invocación de tu etapa en API Gateway (la que da el
despliegue del backend; ver `api-skill_path/docs/despliegue-manual.md`).

```bash
npm run dev
```

Otros comandos:

| Comando | Qué hace |
|---|---|
| `npm run build` | Comprueba tipos y genera `dist/` |
| `npm run preview` | Sirve el build de producción |
| `npm test` | Ejecuta las pruebas |
| `npm run test:watch` | Pruebas en modo vigilancia |

## Pruebas

Las pruebas de componentes verifican **criterios de aceptación**, no detalles de
implementación. Por ejemplo: que la respuesta de una flashcard no se vea antes de
presionar «Ver respuesta», que el botón de guardar un mazo siga bloqueado sin nombre o
sin tarjetas, o que el quiz se autoenvíe al agotarse los 6 minutos.

## Diseño

Las pantallas siguen el prototipo de Figma. Las de **mazos propios** (historia 8) no
existían ahí; se diseñaron con el mismo sistema visual y están documentadas en
`../docs/prototipo-mazos-propios.html`.

Tokens principales, en `tailwind.config.js`:

| Token | Valor | Uso |
|---|---|---|
| `brand` | `#6C4CE6` | Botones primarios, acentos, enlaces |
| `brand-soft` | `#EDE7FE` | Botones secundarios, fondos de icono |
| `mint` / `mint-ink` | `#D9F5E6` / `#0F9D63` | Racha, XP, éxito |
| `canvas` | `#F5F5F9` | Fondo de página |
| `surface-dark` | `#1E1B33` | Tarjetas de estudio |
| `coral` | `#E05A6B` | «Olvidé» y acciones destructivas |

## Cómo contribuir

1. Rama desde `main`: `feature/nombre-corto` o `bugfix/nombre-corto`.
2. Commits con **Conventional Commits**.
3. `npm run build` y `npm test` en verde antes del PR.
4. Revisión de al menos un integrante antes del merge.

| Tipo | Cuándo usarlo | Ejemplo |
|---|---|---|
| `feat` | Nueva funcionalidad | `feat(flashcards): agregar pantalla de repaso` |
| `fix` | Corrección de un bug | `fix(login): corregir validación de contraseña` |
| `docs` | Solo documentación | `docs(readme): actualizar instrucciones` |
| `style` | Formato o estilo | `style(home): ajustar espaciado del header` |
| `refactor` | Ni bug ni función nueva | `refactor(services): simplificar llamadas a la API` |
| `test` | Agregar o corregir pruebas | `test(quiz): cubrir el autoenvío por tiempo` |
| `chore` | Mantenimiento | `chore: actualizar dependencias` |

## Equipo

- Grace Selenia Moscosso Flores
- Débora Elsa Jerónimo Balcázar
- Vanessa Elizabeth Burbano Quintero
- Miguel Ángel Valdivia Bambarén
