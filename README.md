# Job Helper — Backend

API REST del asistente de búsqueda de empleo: gestión de candidaturas, generación de CV y carta de presentación adaptados a cada oferta con Google Gemini, extracción de datos de ofertas desde texto/imagen, exportación a Word/PDF, métricas del proceso y recordatorios automáticos por email.

**Demo en vivo (frontend):** [job-helper-adrianmnd.vercel.app](https://job-helper-adrianmnd.vercel.app)
**API en producción:** `https://job-helper-backend.onrender.com` (requiere el frontend o un cliente autenticado; no navegable directamente salvo `/health`)

> Nota sobre el plan gratuito de Render: el servicio "duerme" tras un periodo de inactividad. La primera petición tras el reposo puede tardar unos segundos extra en responder (cold start).

## Stack

- **Runtime:** Node.js + TypeScript + Express
- **Base de datos:** PostgreSQL (Neon) + Prisma ORM
- **Validación:** Zod
- **Autenticación:** JWT + bcryptjs
- **IA:** Google Gemini API (`@google/generative-ai`) — structured output, few-shot, chain-of-thought y defensas contra prompt injection
- **Exportación de documentos:** `docx` (Word) y `pdfkit` (PDF)
- **Email:** Resend
- **Subida de archivos:** Multer (extracción de ofertas desde imagen/PDF)
- **Testing:** Vitest + Supertest (mocks de Prisma y de Gemini, sin dependencias externas reales en los tests)

## Arquitectura

El proyecto sigue una separación estricta en tres capas, repetida en cada funcionalidad:

```
src/
  routes/        Mapea URL + verbo HTTP -> controller. No contiene lógica de negocio.
  controllers/   Traduce HTTP <-> dominio: lee req, valida con Zod, decide el status code.
  services/      Lógica de negocio y acceso a datos vía Prisma. No sabe nada de HTTP.
  middleware/    Autenticación JWT (requireAuth) y autenticación de cron (requireCronSecret).
  config/        Carga y validación de variables de entorno.
  lib/           Cliente de Prisma, asyncHandler (ver más abajo).
  types/         Tipos compartidos.
```

**`asyncHandler`** (`lib/asyncHandler.ts`): Express 4 no captura excepciones lanzadas dentro de handlers `async`; sin este wrapper, un fallo (por ejemplo, un 503 de Gemini) tumbaría todo el proceso Node en vez de devolver un error controlado al cliente. Cada ruta está envuelta con `asyncHandler(...)`.

**`promptService` vs `geminiService`**: `promptService` decide *qué* le decimos al modelo (reglas, few-shot, schema); `geminiService` decide *cómo* hablamos con la API (cliente, parámetros, parseo). Esta separación permite testear la construcción de prompts sin llamar a la API real.

## Funcionalidades principales

- **Auth** multiusuario con JWT + bcrypt, aislamiento estricto de datos por usuario (el `userId` siempre se deriva del token, nunca de parámetros de la petición).
- **CRUD de candidaturas** con historial de estado transaccional (`StatusHistory`): cada cambio de estado escribe una fila de auditoría en la misma transacción que la actualización.
- **Generación de CV/carta con Gemini**, con seis técnicas de prompt engineering aplicadas: separación system/user prompt, few-shot, structured output (JSON Schema validado también con Zod como red de seguridad), chain-of-thought (campo `keyRequirements` como primer campo del schema), ajuste de `temperature`/`top_p` por tipo de documento, y defensas explícitas contra prompt injection en el contenido externo de la oferta.
- **Extracción de ofertas** desde texto plano (extensión de navegador) o desde imagen/PDF (Gemini Vision).
- **Exportación** de CV/carta a `.docx` y `.pdf` bajo demanda.
- **Métricas del proceso**: embudo de conversión (Guardada → Aplicado → Entrevista → Oferta) y tiempo medio por fase, calculados a partir de `StatusHistory`.
- **Estado inicial "Guardada"**: toda candidatura nace en este estado (no "Aplicado"), reflejando que crear el registro y enviar la solicitud real en la web del ofertante son dos momentos distintos. El paso a "Aplicado" es una acción explícita del usuario, no automática.
- **Recordatorios automáticos**: endpoint protegido por secreto compartido (`/cron/reminders`), disparado a diario por GitHub Actions del repositorio, que avisa por email de candidaturas activas sin movimiento.

## Setup local

```bash
npm install
cp .env.example .env
# Rellena DATABASE_URL, JWT_SECRET, GEMINI_API_KEY, RESEND_API_KEY, CRON_SECRET

npx prisma migrate dev --name init
npm run dev
```

## Variables de entorno

Ver `.env.example` para la lista completa. Las más relevantes:

| Variable | Descripción |
|---|---|
| `DATABASE_URL` | Cadena de conexión de PostgreSQL (Neon) |
| `JWT_SECRET` | Secreto para firmar tokens de sesión |
| `GEMINI_API_KEY` / `GEMINI_MODEL` | Credencial y modelo de Google Gemini |
| `RESEND_API_KEY` | Envío de emails de recordatorio |
| `CRON_SECRET` | Autentica las llamadas al endpoint `/cron/reminders` |
| `E2E_MOCK_GEMINI` | Si es `true` (y `NODE_ENV !== production`), sustituye la llamada real a Gemini por una respuesta enlatada — usado por los tests e2e del frontend para evitar dependencias no deterministas |

## Scripts

```bash
npm run dev              # Desarrollo con recarga automática (tsx)
npm run build             # Compila a dist/
npm run start              # Arranca el build compilado
npm run test               # Suite de tests (Vitest + Supertest)
npm run deploy:migrate     # Aplica migraciones ya existentes (uso en producción, nunca migrate dev)
```

`scripts/evaluatePrompts.ts` es una herramienta de desarrollo (no parte de la app desplegada) para comparar la salida de Gemini con distintas temperaturas sobre una misma candidatura real:

```bash
npx tsx scripts/evaluatePrompts.ts <applicationId>
```

## Despliegue

Desplegado en **Render** (free tier):
- Build: `npm install && npx prisma migrate deploy && npm run build`
- Start: `npm run start`
- Base de datos en **Neon**, con ramas separadas para desarrollo y producción (branching de Neon, no bases de datos distintas gestionadas a mano).
- Recordatorios diarios disparados por **GitHub Actions** (ver `.github/workflows/`), no por un cron job de pago de Render.

## Repositorios relacionados

- [job-helper-frontend](https://github.com/AdrianMnd/job-helper-frontend) — Aplicación web (React + TypeScript)
- [job-helper-extension](https://github.com/AdrianMnd/job-helper-extension) — Extensión de navegador para capturar ofertas
- [job-helper-android](https://github.com/AdrianMnd/job-helper-android) — Versión Android (TWA)

## Licencia

ISC — ver [LICENSE](./LICENSE)
