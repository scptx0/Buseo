# AGENTS.md

Guía de contexto para agentes y contribuidores de este repositorio.

## Proyecto

Aplicación web (SPA, Vite + React 19 + TypeScript) para el corredor del **Metropolitano (Lima)**: planear rutas, reportar el estado de buses/estaciones/tramos y ver la ubicación de buses en tiempo real.

## Comandos

- `npm install` — instala dependencias.
- `npm run dev` — servidor de desarrollo (Vite).
- `npm run build` — typecheck + build de producción.
- `npm run preview` — sirve el build de producción.
- `npm run typecheck` — verifica tipos con `tsc --noEmit`.

## Stack

| Capa | Tecnología | Estado |
|------|-----------|--------|
| Frontend | React 19 + Vite + TypeScript | Scaffold listo |
| Mapas | Google Maps JS (`@googlemaps/js-api-loader`) | Placeholder sin key |
| Tiempo real | Portal (`@portalsdk/core` + `@portalsdk/react`) | CLI y cuenta listos, sin integrar en app |
| Backend | Supabase (`@supabase/supabase-js` + Edge Functions) | Scaffold; Edge Function de reportes-IA por construir |
| Geoespacial | `@turf/turf` | Dep instalado, sin uso |
| IA | AWS Bedrock (modelo por definir; candidato DeepSeek v3.2) | Desde Supabase Edge Function (Fase 3) |

Los datos provienen de `src/lib/mockData.ts` (mocks) hasta conectar credenciales reales.

## Configuración de entornos

Variables requeridas (ver `.env.example`). **Nunca commitear valores reales**: los valores
viven solo en `.env.local` (gitignored), en manos del owner del proyecto. No documentar en
el repo IDs de proyecto/entorno ni claves.
- `VITE_GOOGLE_MAPS_API_KEY`
- `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- Portal: `NEXT_PUBLIC_PORTAL_KEY` / `VITE_PORTAL_KEY` (pública `pk_`, va al cliente) y
  `PORTAL_SECRET` (secreta `sk_`, nunca al cliente). Actualizar también `.env.example`.
- Backend (Edge Function): `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_URL`, `PORTAL_SECRET_BACKEND`,
  `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `BEDROCK_MODEL_ID` — solo en
  variables de entorno de la Edge Function, **nunca** en el cliente ni en el repo.

## Convenciones de código

- TypeScript estricto: `noUnusedLocals`, `noUnusedParameters`, `verbatimModuleSyntax`.
- Al importar tipos, usar `import type`.
- UI en `src/app/{feature}/`, componentes reutilizables en `src/components/`.
- Integraciones con Portal vía canales; **no** usar Supabase Realtime.
- Importar librerías desde sus paths directos, no barriles pesados.

## Arquitectura

Ver `@docs/ARCHITECTURE.md` para la propuesta técnica completa. Principios:

- Persistencia: Supabase PostgreSQL + PostGIS.
- Alta frecuencia de escritura: DynamoDB (rumas GPS, reportes en caliente).
- Distribución en vivo: Portal (canales broadcast + inbox por usuario).
- Inteligencia: AWS Bedrock (Agrupación de reportes, filtro anti-falsos-positivos).
- Mapas geoespaciales: Turf.js (buffer de corredores, punto-en-polígono).

## Referencias a documentación

- **Progreso del proyecto (para el equipo):** `@docs/STATUS.md`.
- **Contratos técnicos (canales Portal, payloads, tipos):** `@docs/CONTRACTS.md`.
- **Arquitectura completa:** `@docs/ARCHITECTURE.md`. Para el MVP se prioriza el plan del
  `STATUS.md`; la arquitectura larga es guía, no todo es para la hackathon. Alcance incluido:
  núcleo de la app + IA de reportes (Bedrock vía Supabase Edge Function) + detección de
  abordaje con Turf. Fuera: Canal/moderación.

## Skills de referencia

- `frontend-design` (UI), `supabase`, `vercel-react-best-practices`,
  `nodejs-backend-patterns`, `systematic-debugging`, `brainstorming`, `better-icons`.

## Acciones respecto a documentación

- Mantener `@docs/STATUS.md` (bitácora del equipo, sin detalles técnicos/envs). Actualizar
  también el archivo de especificación que corresponda si cambian los requerimientos.
- Antes de programar una integración (Portal, mapas, reportes), leer `@docs/CONTRACTS.md`
  para respetar los contratos de canales y payloads.
- Antes de realizar cualquier acción, siempre leer `@docs/SPEC.md` (funcional).

## Documentación de Portal

Documentación oficial de Portal (canales realtime, inbox, presencia, SDKs):
**https://docs.useportal.co/**

Páginas útiles:
- Quickstart (raíz): `https://docs.useportal.co/`
- Core SDK, cliente y setup: `https://docs.useportal.co/core/client-setup`
- React: `PortalProvider` y `useChannel` (`https://docs.useportal.co/react/provider`, `https://docs.useportal.co/react/use-channel`)
- Guía de chat realtime: `https://docs.useportal.co/guides/realtime-chat`
- Tokens y auth: `https://docs.useportal.co/core/tokens-and-auth`
- `portal.config.ts`: `https://docs.useportal.co/config-cli/portal-config`

Notas:
- Es `@portalsdk/core` + `@portalsdk/react`. No confundir con `docs.portalhq.io`
  (otro producto, blockchain/MPC).
- `pk_` (pública) va en el cliente; `sk_` (secreta) solo en backend, nunca commitear.
- No hay endpoint `/quickstart`; la raíz `docs.useportal.co/` ES el quickstart.
- Si una URL da 404, usar el índice completo `docs.useportal.co/llms.txt`.

## Convenio de commits

- **Formato:** Use `<tipo>: <titulo>` (Conventional Commits).
- **Cuerpo:** Incluir un breve "Por qué" y "Qué" si el cambio es no trivial. No escribas "por qué" o "cómo" en el cuepro, solo escribe los cambios. No es obligatorio escribir un cuerpo, solo si los cambios no son triviales.
- Considera archivos de agentes de codigo para los commits.

## Pull requests

Si el usuario pide un mensaje de pull request, tiene que ser del siguiente formato:

<Tipo>: <Titulo>

<Resumen>

### Cambios

- <Cambio 1.1>
- <Cambio 1.2>
- ...

Reglas:
- El texto debe estar en español
- Solo verbos en forma infinitiva
- Esto es SOLO PARA LA DESCRIPCION DE UN PULL REQUEST EN GITHUB, no para commits locales