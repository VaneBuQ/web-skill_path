# SkillPath — Web (Frontend)

Aplicación web de **microlearning activo** para personas que están cursando una especialización, bootcamp, maestría o materia universitaria (álgebra, estadística, programación, estructuras de datos, etc.). Permite estudiar mediante flashcards con repetición espaciada, autoevaluarse con quizzes y dar seguimiento al progreso por tema.

Proyecto desarrollado para el curso **Cloud Computing** — Maestría en Ciencia de Datos e Inteligencia Artificial (CDIA V5), UTEC Posgrado.

Repositorio del backend (microservicios): [api-skill_path](https://github.com/VaneBuQ/api-skill_path)

## Funcionalidades (MVP)

- [ ] Registro de cuenta (correo/contraseña o Google)
- [ ] Inicio de sesión
- [ ] Página principal (Home) con resumen de racha, temas activos y accesos directos
- [ ] Crear/seguir un mazo de estudio por tema
- [ ] Estudiar tarjetas de repaso (flashcards)
- [ ] Calificar mi propio repaso (Olvidé / Difícil / Fácil)
- [ ] Ver mi progreso por tema
- [ ] Hacer un quiz de autoevaluación

## Tecnologías

- Prototipo inicial generado con [Figma Make](https://www.figma.com/community/file/1591644903553496438/seguro-de-viaje-ejemplo-simple) / [Lovable]
- *(Completar con el stack final: React, Vite, Tailwind, etc.)*
- Consumo de APIs del repositorio [api-skill_path](https://github.com/VaneBuQ/api-skill_path)

## Estructura del proyecto

```
web-skill_path/
├── public/
├── src/
├── .env.example
├── package.json
└── README.md
```

## Instalación y ejecución local

```bash
# clonar el repositorio
git clone https://github.com/VaneBuQ/web-skill_path.git
cd web-skill_path

# instalar dependencias
npm install

# configurar variables de entorno
cp .env.example .env
# editar .env con la URL base de las APIs (ver api-skill_path)

# ejecutar en modo desarrollo
npm run dev
```

## Cómo contribuir

1. Crear una rama a partir de `main` con el prefijo del tipo de cambio:
   - `feature/nombre-corto` — nueva funcionalidad
   - `bugfix/nombre-corto` — corrección de un bug
2. Hacer commits siguiendo el estándar **Conventional Commits** (ver tabla abajo).
3. Abrir un Pull Request hacia `main` describiendo el cambio y, si aplica, la historia de usuario que cubre.
4. Esperar la revisión de al menos un integrante del equipo antes de hacer merge.

### Estructura de los commits

Formato: `tipo(alcance opcional): descripción breve en presente`

| Tipo | Cuándo usarlo | Ejemplo |
|---|---|---|
| `feat` | Nueva funcionalidad | `feat(flashcards): agregar pantalla de repaso` |
| `fix` | Corrección de un bug | `fix(login): corregir validación de contraseña` |
| `docs` | Cambios solo de documentación | `docs(readme): actualizar instrucciones de instalación` |
| `style` | Cambios de formato/estilo (sin afectar lógica) | `style(home): ajustar espaciado del header` |
| `refactor` | Cambio de código que no arregla un bug ni agrega función | `refactor(services): simplificar llamadas a la API` |
| `test` | Agregar o corregir pruebas | `test(quiz): agregar pruebas del componente Quiz` |
| `chore` | Tareas de mantenimiento (dependencias, config, build) | `chore: actualizar dependencias de npm` |

## Equipo

- Nombre Apellido — rol
- Nombre Apellido — rol

## Curso

**Cloud Computing** — Maestría en Ciencia de Datos e Inteligencia Artificial (CDIA V5)
Docente: Oscar Mejía — UTEC Posgrado
