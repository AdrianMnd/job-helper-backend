# Job Assistant - Backend

Backend del asistente de busqueda de empleo: gestion de candidaturas + generacion
de CV/carta de presentacion adaptados con Gemini.

## Stack

- Node.js + TypeScript + Express
- Prisma ORM + PostgreSQL
- Zod (validacion de inputs)
- JWT + bcrypt (autenticacion)
- @google/generative-ai (Gemini)

## Setup

```bash
npm install
cp .env.example .env
# Rellena .env: DATABASE_URL, JWT_SECRET, GEMINI_API_KEY

npx prisma migrate dev --name init
npm run dev
```

## Estructura

```
src/
  config/       Carga y validacion de variables de entorno
  middleware/   Auth (JWT)
  routes/       Definicion de endpoints + conexion a controllers
  controllers/  Recibe el request, valida con Zod, llama a services
  services/
    applicationService.ts  CRUD de candidaturas + historial de estado
    profileService.ts      CRUD del perfil base
    promptService.ts       Construccion de prompts para Gemini (AISLADO)
    geminiService.ts       Llamada cruda a la API de Gemini
  lib/          Cliente de Prisma
  types/        Tipos compartidos
```

## Por que promptService y geminiService estan separados

`promptService` decide QUE le decimos al modelo. `geminiService` decide COMO
hablamos con la API (cliente, parametros, parseo de respuesta). Esta separacion
permite testear la logica de prompts sin hacer llamadas reales a Gemini, y es
el punto donde vamos a iterar cuando trabajemos la parte de prompt engineering
en profundidad.

## Pendiente / proximos pasos

- Tests (Vitest + Supertest, siguiendo el patron de Task Agent: mockear Prisma
  y geminiService para que los tests no dependan de red ni BD real)
- Iterar promptService: few-shot examples, structured output (JSON schema),
  medidas contra prompt injection en jobDescription
- Verificar el nombre de modelo Gemini vigente en `config/env.ts`
