# Project: FeriaMatch (Logística de Ferias de Empleo)

## 1. Vision & Core Problem
Plataforma centralizada para la gestión de agendas en ferias de empleo.
- **Problema:** Evitar el caos de agendas libres y maximizar entrevistas.
- **Solución:** La Cámara de Comercio (Admin) define la estructura de tiempo (Slots); las Empresas ocupan esos slots; los Candidatos reservan.
- **Critical Business Logic:** Las empresas NO pueden alterar la duración ni horas de la feria. La gestión del tiempo es 100% centralizada.

## 2. User Personas & Roles
- **Admin (Cámara de Comercio):** "Time Lord". Crea Eventos, define Horario Global y Duración de Slots.
- **Empresa (Reclutador):** Gestiona la ocupación de sus slots pre-asignados. Valida asistencia (Mobile First).
- **Candidato:** Visualiza y reserva huecos disponibles ("Libre" -> "Reservado").

## 3. Tech Stack
- **Frontend:** React + Vite + TypeScript.
- **UI Framework:** Tailwind CSS + shadcn/ui.
- **Backend/DB:** Supabase (PostgreSQL).
- **Auth:** Supabase Auth.
- **Storage:** Supabase Storage (CVs).

## 4. Design Guidelines (The Vibe)
- **Style:** "Corporate Clean & Friendly".
- **References:** Airbnb (Clean cards), Notion/Linear (Clean lists).
- **Palette:** Institutional Blue + Action Green. Background: slate-50/white.
- **Responsiveness:** Mobile First Priority (Large touch targets).

## 5. Development Rules (House Rules)
- **Language Rule:** Respond in Spanish, but write all code comments in English.
- **Atomic Workflow:** Build Structure -> UI -> Data -> Logic.
- **Security:** No "VibeScamming". Secure Auth via Supabase only.
