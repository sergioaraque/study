# Study Planner · UNED

Aplicación web para gestionar el estudio en la UNED. Organiza semestres, asignaturas, temas y tareas; planifica tu semana; controla notas y el progreso del expediente académico.

**Demo:** [study.sergioaraque.com.es](https://study.sergioaraque.com.es)

---

## Funcionalidades

- **Dashboard** — Vista rápida con estado del semestre, alertas de ritmo, PECs y exámenes próximos, racha de estudio y resumen semanal.
- **Asignaturas** — CRUD de asignaturas por semestre. Biblioteca de asignaturas sin semestre asignado para matriculación rápida.
- **Temas** — División de cada asignatura en temas numerados. Estado (pendiente / en progreso / completado), horas estimadas y reales, tareas de estudio por tema.
- **Planificador** — Vista semanal y mensual con drag & drop. Asigna temas a días, controla horas disponibles por día y detecta sobrecargas.
- **Plan vs Realidad** — Comparativa semanal entre lo planificado y lo completado.
- **PECs** — Gestión de entregas con fechas límite, estado y nota. Recordatorios por notificación push.
- **Exámenes** — Registro de convocatorias (C1/C2), fechas y notas. Recordatorios automáticos.
- **Tutorías** — Registro de tutorías y tareas de revisión.
- **Estadísticas** — Progreso por asignatura, horas de estudio, media de PECs y comparativa entre semestres.
- **Expediente académico** — Vista global con todos los créditos matriculados/superados, media ponderada y nota por asignatura.
- **Notificaciones push** — Recordatorios de PECs y exámenes mediante Web Push (VAPID).
- **Tema claro/oscuro** — Alternancia de tema con persistencia en localStorage.
- **Búsqueda global** — Búsqueda rápida de asignaturas y temas con atajo de teclado.

---

## Stack tecnológico

### Frontend
| Tecnología | Versión | Uso |
|---|---|---|
| [Vue 3](https://vuejs.org/) | 3.x | Framework reactivo con Composition API |
| [Vite](https://vitejs.dev/) | 7.x | Bundler y servidor de desarrollo |
| [TypeScript](https://www.typescriptlang.org/) | 5.x | Tipado estático |
| [Pinia](https://pinia.vuejs.org/) | 2.x | Gestión de estado |
| [Vue Router](https://router.vuejs.org/) | 4.x | Enrutamiento SPA |
| [Tailwind CSS](https://tailwindcss.com/) | 4.x | Estilos utilitarios |
| [Lucide Vue Next](https://lucide.dev/) | — | Iconos |
| [date-fns](https://date-fns.org/) | 4.x | Manipulación de fechas |
| [vite-plugin-pwa](https://vite-pwa-org.netlify.app/) | 1.x | PWA + service worker |
| [Appwrite SDK](https://appwrite.io/docs/sdks) | 17.x | Cliente para la base de datos |

### Backend
| Tecnología | Versión | Uso |
|---|---|---|
| [Node.js](https://nodejs.org/) | 22.x | Runtime |
| [Express](https://expressjs.com/) | 4.x | Servidor HTTP |
| [Appwrite Node SDK](https://appwrite.io/docs/sdks) | 17.x | Operaciones servidor (envío de push) |
| [web-push](https://github.com/web-push-libs/web-push) | — | Envío de notificaciones Web Push (VAPID) |

### Infraestructura
| Servicio | Uso |
|---|---|
| [Appwrite](https://appwrite.io/) (self-hosted) | Base de datos, autenticación |
| [Coolify](https://coolify.io/) | Plataforma de despliegue en VPS |
| [Docker Compose](https://docs.docker.com/compose/) | Contenedores frontend + backend |
| Traefik (vía Coolify) | Reverse proxy + TLS automático |

---

## Estructura del proyecto

```
study/
├── frontend/               # App Vue 3
│   ├── src/
│   │   ├── assets/         # Estilos globales (Tailwind)
│   │   ├── components/     # Componentes reutilizables
│   │   │   ├── dashboard/
│   │   │   ├── exams/
│   │   │   ├── layout/     # AppShell, Sidebar, Topbar
│   │   │   ├── pecs/
│   │   │   ├── planner/
│   │   │   ├── semesters/
│   │   │   ├── subjects/
│   │   │   ├── topics/
│   │   │   ├── tutoring/
│   │   │   └── ui/         # BaseButton, BaseInput, BaseSidepanel…
│   │   ├── composables/    # useStreak, useKeyboardSearch…
│   │   ├── lib/            # appwrite.ts, collections.ts, ics.ts
│   │   ├── router/         # Vue Router con guard de autenticación
│   │   ├── stores/         # Pinia stores (auth, subject, topic, planner…)
│   │   ├── types/          # Interfaces TypeScript (Subject, Topic, Exam…)
│   │   └── views/          # Vistas principales
│   ├── Dockerfile
│   └── package.json
├── backend/                # Express API (notificaciones push)
│   ├── src/
│   │   └── index.ts        # Endpoints /api/push/subscribe y /api/push/notify
│   ├── scripts/
│   │   └── setup-appwrite.ts  # Script de inicialización del schema Appwrite
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml
└── .env.example            # Variables de entorno requeridas
```

---

## Variables de entorno

Copia `.env.example` a `.env` y rellena los valores.

### Frontend (tiempo de build)
```
VITE_APPWRITE_ENDPOINT=https://tu-appwrite.com/v1
VITE_APPWRITE_PROJECT_ID=...
VITE_APPWRITE_DATABASE_ID=...
VITE_BACKEND_URL=https://tu-backend.com
# Nombres de colecciones (opcional, por defecto los de abajo)
VITE_COL_SEMESTERS=semesters
VITE_COL_SUBJECTS=subjects
VITE_COL_TOPICS=topics
VITE_COL_STUDY_SESSIONS=study_sessions
VITE_COL_PECS=pecs
VITE_COL_EXAMS=exams
VITE_COL_TUTORING_SESSIONS=tutoring_sessions
VITE_COL_TOPIC_TASKS=topic_tasks
```

### Backend
```
APPWRITE_ENDPOINT=https://tu-appwrite.com/v1
APPWRITE_PROJECT_ID=...
APPWRITE_API_KEY=...          # API key con permisos de lectura en colecciones
APPWRITE_DATABASE_ID=...
VAPID_PUBLIC_KEY=...          # Generado con web-push generate-vapid-keys
VAPID_PRIVATE_KEY=...
VAPID_MAILTO=mailto@ejemplo.com
FRONTEND_URL=https://tu-app.com
```

---

## Despliegue local

### Requisitos
- Docker y Docker Compose
- Una instancia de Appwrite con las colecciones creadas (ver setup)

### Inicializar el schema de Appwrite
```bash
cd backend
cp .env.example .env   # rellena APPWRITE_* y DATABASE_ID
npm install
npm run setup-appwrite
```

### Levantar con Docker Compose
```bash
cp .env.example .env   # rellena todas las variables
docker compose up --build
```

La app estará disponible en `http://localhost` (el frontend) y el backend en el puerto 3001 internamente.

---

## Despliegue en producción (Coolify)

1. Conecta el repositorio en Coolify como **Docker Compose**.
2. Añade todas las variables de entorno en el panel "Environment Variables".
3. Coolify inyecta las variables como `ARG` en el build del Dockerfile automáticamente.
4. Asigna un dominio — Traefik gestiona el TLS de forma automática.

---

## Licencia

MIT
