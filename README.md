# 🚀 FeriaMatch Sync

**Plataforma de gestión inteligente para ferias de empleo y Speed Recruiting.**

FeriaMatch Sync es una solución SaaS diseñada para optimizar la conexión entre talento y empresas en eventos presenciales y digitales. A diferencia de un calendario tradicional, utiliza una lógica de **"Slots Secuenciales"** para maximizar el número de entrevistas y garantizar el orden operativo.

![Project Status](https://img.shields.io/badge/Status-Beta-blue)
![Tech Stack](https://img.shields.io/badge/Stack-React_|_Supabase_|_Tailwind-success)

## 💡 Propuesta de Valor

El sistema resuelve el caos habitual de las ferias de empleo mediante un modelo de agenda centralizada:
- **Para el Admin:** Control total ("White Glove") sobre qué empresas ocupan qué horarios.
- **Para la Empresa:** Recepción secuencial de candidatos sin *overbooking*.
- **Para el Candidato:** Feedback visual inmediato (Pendiente/Confirmado) y protección contra solapamientos.

## 🛠️ Stack Tecnológico

Este proyecto ha sido construido utilizando arquitectura moderna y escalable:

* **Frontend:** React + Vite + TypeScript
* **Estilos:** Tailwind CSS + Shadcn UI (Diseño limpio y responsive).
* **Backend & Base de Datos:** Supabase (PostgreSQL + Realtime).
* **Generación de Código:** Lovable.dev & AI Assisted Development.

## ✨ Funcionalidades Clave

### 1. Gestión de Eventos (Admin)
* 📅 **Generador de Parrilla:** Creación automática de slots de 15 minutos (estándar de la industria).
* 🏢 **Asignación "White Glove":** El administrador asigna rangos horarios a las empresas según su plan (Mañana/Tarde/Full Day).
* ✏️ **Edición en Caliente:** Capacidad de modificar parámetros del evento y regenerar agendas vacías.

### 2. Experiencia del Candidato
* 🚦 **Semáforo de Estados:** Visualización clara de disponibilidad (Libre, En Revisión ⏳, Confirmada ✅, Ocupada ⛔).
* 🔒 **Regla de los 10 Minutos:** Bloqueo automático de solicitudes 10 minutos antes del inicio para evitar sorpresas.
* 🚫 **Anti-Spam:** Limitación lógica de "Máx. 1 solicitud pendiente por empresa" para evitar acaparadores.

### 3. Lógica de Negocio (Slots)
* **Capacidad Unitaria:** Prioridad al modelo "1 a 1". El slot se bloquea temporalmente al recibir una solicitud.
* **Flujo Secuencial:** Si la empresa rechaza al candidato A, el slot se libera automáticamente para el candidato B.

## 📸 Capturas de Pantalla

<img width="1690" height="912" alt="image" src="https://github.com/user-attachments/assets/0eefe822-cd50-46ae-97f9-24ccc6b22efc" />
<img width="723" height="1014" alt="image" src="https://github.com/user-attachments/assets/be0ebc01-78e9-4e98-8623-52db3f2008fe" />



## 🚀 Instalación y Despliegue Local

Sigue estos pasos para correr el proyecto en tu máquina:

```bash
# 1. Clonar el repositorio
git clone [https://github.com/Joseibaez/FeriaMatch_sync.git](https://github.com/Joseibaez/FeriaMatch_sync.git)

# 2. Entrar en el directorio
cd FeriaMatch_sync

# 3. Instalar dependencias
npm install

# 4. Configurar variables de entorno
# Crea un archivo .env y añade tus claves de Supabase:
# VITE_SUPABASE_URL=tu_url
# VITE_SUPABASE_ANON_KEY=tu_key

# 5. Ejecutar servidor de desarrollo
npm run dev
## What technologies are used for this project?

🔐 Seguridad y Privacidad
Row Level Security (RLS): Las empresas solo pueden ver sus propios datos.

Visibilidad Pública: Los candidatos pueden ver el catálogo de empresas (escaparate), pero no los datos de contacto internos hasta confirmar la cita.

🤝 Contribución
Este proyecto es parte de un desarrollo ágil enfocado en MVP. Las Pull Requests son bienvenidas.

Desarrollado con ❤️ por Jose Ibañez
