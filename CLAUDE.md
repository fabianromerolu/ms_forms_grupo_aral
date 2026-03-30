# CLAUDE.md — ms_forms_grupo_aral (Backend API)

## Project Overview
NestJS 11 REST API for Grupo Aral's field maintenance management system.
Stack: NestJS · Prisma ORM · PostgreSQL · JWT Auth · Swagger/OpenAPI

## Language Rules
- **Architecture (files, folders, classes, interfaces, variables, functions):** English only
- **Content (UI strings, comments, API route paths, DB field names):** Spanish is acceptable
- **API route decorators** like `@Controller('incidencias')` keep their Spanish URL paths — they match frontend calls
- **Prisma model names** (`Incidencia`, `Cotizacion`, etc.) keep their Spanish names — they map directly to DB tables

## Git Rules — STRICTLY ENFORCED
- **NEVER push to `main` branch**
- **NEVER create a PR targeting `main`**
- All changes must be on a feature branch (`feature/`, `fix/`, `chore/`)
- Create a new branch before any commit: `git checkout -b feature/your-description`

## Database Rules
- ✅ Can run `prisma migrate dev` to create new migrations
- ✅ Can run `prisma db seed` to populate seed data
- ❌ CANNOT run `prisma migrate reset` — it empties the database
- ❌ CANNOT run `prisma db push --force-reset`
- ❌ CANNOT run any SQL that drops or truncates tables

## Architecture
```
src/
├── activities/       # Actividades module (audit log of user actions)
├── auth/             # JWT authentication (login, register, guards)
├── incidents/        # Incidencias (work orders / field incidents)
├── metrics/          # Dashboard KPIs
├── notifications/    # Email/push notification service
├── prisma/           # PrismaService wrapper
├── quotes/           # Cotizaciones (service quotes)
├── reports/          # Field maintenance reports
├── requests/         # Solicitudes de servicio (service requests)
├── stores/           # Tiendas (store locations)
├── typologies/       # Tipologías (store classification)
├── types/            # Shared TypeScript interfaces
├── users/            # User management
└── utils/            # Shared utilities (pagination, search, etc.)
```

## Module Naming Conventions
- Folder: `kebab-case` (English)
- Files: `<name>.controller.ts`, `<name>.module.ts`, `<name>.service.ts`
- DTOs: `dto/create-<name>.dto.ts`, `dto/update-<name>.dto.ts`
- Classes: `PascalCase` (English)

## Key Endpoints
- `POST /auth/login` — Login
- `POST /auth/register` — Register
- `GET/POST /incidents` — Incidents CRUD
- `GET/POST /quotes` — Quotes CRUD
- `GET/POST /stores` — Stores CRUD
- `GET/POST /typologies` — Typologies CRUD
- `GET/POST /requests` — Service requests CRUD
- `GET/POST /activities` — Activity log
- `GET /metrics/dashboard` — KPI metrics
- `GET/POST /reports` — Field reports
