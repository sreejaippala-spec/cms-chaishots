# ChaiShorts CMS & Public Catalog API

> **Assignment Submission**
> *   **Topic**: Admin CMS + Public Catalog API + Scheduled Publishing
> *   **Stack**: Node.js, React, PostgreSQL, Docker
> *   **Focus**: System Design, Concurrency Safety, and Production Readiness.

---

## 📖 Table of Contents

1.  [Project Overview](#-project-overview)
2.  [One-Command Deployment](#-one-command-deployment)
3.  [Access Guide & Credentials](#-access-guide--credentials)
4.  [Architecture & Design Decisions](#-architecture--design-decisions)
5.  [Backend Deep Dive](#-backend-deep-dive)
6.  [Frontend Deep Dive](#-frontend-deep-dive)
7.  [Worker Service & Scheduling](#-worker-service--scheduling)
8.  [Database Schema](#-database-schema)
9.  [API Documentation](#-api-documentation)
10. [Verification & Demo Flow](#-verification--demo-flow)

---

## 🎯 Project Overview

**ChaiShorts** is a robust Mini-CMS designed to manage educational content structures (Programs -> Terms -> Lessons). It solves a critical business need: allowing content editors to **schedule** lessons for future release, which are then automatically published by a background worker.

### Key Features
*   **Role-Based Access Control (RBAC)**: Distinct permissions for Admins, Editors, and Viewers.
*   **Scheduled Publishing**: A "Set it and forget it" workflow for content release.
*   **Multi-Language Support**: Built-in support for English, Hindi, and Spanish content and metadata.
*   **High-Performance Catalog**: Public API endpoints optimized with caching for consumer applications.
*   **Asset Management**: Strict validation for required marketing assets (Posters/Thumbnails) per language.

---

## 🚀 One-Command Deployment

This project is fully containerized. You do not need to install Node.js or PostgreSQL locally. The entire production stack can be launched with **Docker Compose**.

### Prerequisite
*   **Docker Desktop** (running)

### Installation Steps

1.  **Clone/Open** the repository.
2.  **Run the Production Stack**:
    open your terminal in the project root and execute:

    ```bash
    docker compose -f docker-compose.prod.yml up --build -d
    ```

    **What happens next?**
    *   🐳 **Containers Build**: A multi-stage Docker build compiles the React frontend into static assets and optimizes the Node.js backend image.
    *   🗄️ **Database Starts**: PostgreSQL 15 initializes.
    *   🔄 **Migrations Run**: The `api` container waits for the DB, then automatically runs `npm run migrate`.
    *   🌱 **Seeding Runs**: The system populates itself with sample Users, Programs, and Lessons via `npm run seed`.
    *   🌐 **Services Launch**: The API (Port 3000), Worker, and Frontend (Port 80 via Nginx) start up.

    *Please wait approx. 30-60 seconds for the initial setup to complete.*

---

## 🔑 Access Guide & Credentials

### ☁️ Google Cloud Deployed Application (Live Demo)
*   **URL**: [http://34.57.23.4/](http://34.57.23.4/)
*   **Description**: Access the fully deployed application running on Google Cloud.

Once the local stack is running, you can access the following services:

### 1. CMS Web Dashboard
*   **URL**: [http://localhost](http://localhost)
*   **Description**: The administrative interface for internal teams.

### 2. Public Catalog API
*   **URL**: [http://localhost:3000/api/catalog/programs](http://localhost:3000/api/catalog/programs)
*   **Description**: Read-only API for the consumer mobile/web app. Returns only **Published** content.

### 3. Login Credentials
The seed script creates three users with distinct roles to verify RBAC:

| Role | Email | Password | Capability |
| :--- | :--- | :--- | :--- |
| **Editor** | `editor@example.com` | `password123` | **(Recommended)** Can create, edit, schedule, and publish content. Cannot manage users. |
| **Admin** | `admin@example.com` | `password123` | Superuser access. Can delete anything and manage system users. |
| **Viewer** | `viewer@example.com` | `password123` | Read-only access. "Edit" buttons and "Publish" actions are hidden/disabled. |

---

## 🏗 Architecture & Design Decisions

### Monorepo Structure
The codebase is organized into a clean monorepo structure:
*   `backend/`: Contains the Express API, Worker, and Database logic.
*   `frontend/`: Contains the React Admin UI.
*   `docker-compose.prod.yml`: Orchestration for the production environment.

### Database Strategy: Normalized Tables
We selected **Option A: Normalized Tables** (`program_assets`, `lesson_assets`) over JSON columns.

*   **Reasoning**: Data integrity is paramount for a CMS.
    *   We strictly enforce **Uniqueness** on `(entity_id, language, variant)`. A program cannot accidentally have two "English Portrait" posters.
    *   We use **Foreign Keys** with `ON DELETE CASCADE`. Deleting a program automatically cleans up its terms, lessons, and assets, preventing orphaned data.

### Production Readiness
*   **Nginx for Frontend**: Instead of running a heavy Node.js dev server (`vite dev`), we build the React app to static HTML/CSS/JS and serve it via Nginx. This is how real single-page apps are deployed.
*   **Optimized Docker Images**: We use `node:20-alpine` and clean `npm ci --only=production` installs to permit faster startup and smaller image sizes.

---

## 🔙 Backend Deep Dive

**Tech Stack**: Node.js, Express, Knex.js (Query Builder), PostgreSQL.

### Core Components
1.  **`src/api`**: The REST API layer.
    *   **Controllers**: Handle business logic (`programController.js`, `lessonController.js`).
    *   **Middleware**:
        *   `authMiddleware.js`: Verifies JWT tokens.
        *   `roleMiddleware.js`: Enforces permissions (e.g., `authorize('admin', 'editor')`).
2.  **`src/config/db.js`**: Database connection pool configuration.
3.  **`src/db`**:
    *   **`migrations/`**: Version-controlled schema changes.
    *   **`seeds/`**: Idempotent data population scripts.

### Security
*   **BCrypt**: Passwords are never stored in plain text. They are salted and hashed.
*   **JWT**: Stateless authentication using JSON Web Tokens.
*   **Helmet**: Sets secure HTTP headers to prevent common attacks.

---

## 🖥️ Frontend Deep Dive

**Tech Stack**: React 18, Vite, TailwindCSS, Zustand (State Management), React Router.

### Key Features
*   **Zustand Auth Store**: Manages the user's session and role. It persists the token to `localStorage` and handles auto-logout on 401 errors.
*   **Dynamic UI**: The interface adapts based on the user's role.
    *   *Viewers* see a simplified UI with no action buttons.
    *   *Editors* see full controls for managing data.
*   **Toast Notifications**: integrated via `react-hot-toast` for immediate user feedback on actions (Success/Error).
*   **Optimistic Updates**: The UI often updates immediately while the API request processes to feel snappy.

### Component Structure
*   `Layout.jsx`: The main shell with the sidebar and header.
*   `LessonEditor.jsx`: A complex form component handling validation, media previews, and the publishing workflow.
*   `ProgramList.jsx`: Displays the grid of courses with filters for Status, Language, and Topic.

---

## ⚙️ Worker Service & Scheduling

The **Worker** is a critical piece of the infrastructure. It runs independently from the API.

*   **Location**: `backend/src/worker/`
*   **Frequency**: Runs every **60 seconds** (via `setInterval`).

### The "Concurrency Safe" Strategy
To ensure that we can scale workers horizontally (run multiple worker containers) without them fighting over the same tasks, we use a specific PostgreSQL locking strategy:

```javascript
// backend/src/worker/publisher.js
const lessonsToPublish = await trx('lessons')
  .where('status', 'scheduled')
  .andWhere('publish_at', '<=', new Date())
  .forUpdate()      // Locks the rows
  .skipLocked();    // Tells other workers to skip these locked rows
```

**Why this matters**:
1.  **Atomic**: Use of transactions ensures we don't partially update data.
2.  **No Duplicates**: A lesson is processed exactly once.
3.  **Scalable**: We can add 10 more worker containers, and they will efficiently share the workload without conflict.

---

## 🗄️ Database Schema

### `programs`
*   `id` (UUID, PK)
*   `title`, `description`
*   `status` (draft, published, archived)
*   `language_primary`, `languages_available` (Array)

### `terms`
*   `program_id` (FK -> programs)
*   `term_number` (Int)
*   *Constraint*: Unique `(program_id, term_number)`

### `lessons`
*   `term_id` (FK -> terms)
*   `status`, `publish_at`
*   `content_type` (video, article)
*   `content_urls_by_language` (JSON)

### `program_assets` / `lesson_assets`
*   `program_id`/`lesson_id` (FK)
*   `language` (en, hi, es)
*   `variant` (portrait, landscape)
*   `url` (String)

---

## 📡 API Documentation

### Public Catalog (No Auth)
These endpoints are public and cached.

**GET /api/catalog/programs**
*   Returns list of programs with >= 1 published lesson.
*   Params: `?limit=10&cursor=...&topic=tech`
*   Response:
    ```json
    {
      "data": [
        {
          "id": "...",
          "title": "Web Development",
          "assets": { "posters": { "en": { "portrait": "..." } } }
        }
      ],
      "next_cursor": "..."
    }
    ```

**GET /api/catalog/programs/:id**
*   Returns full details, ordered terms, and published lessons.

### CMS (Internal Management)
**Base URL**: `/api/cms`
**Auth**: `Authorization: Bearer <token>`

#### Authentication
**1. Login**
*   **POST** `/login`
*   **Body**: `{ "email": "admin@example.com", "password": "password123" }`
*   **Response**: `{ "token": "eyJ...", "user": { "role": "admin", ... } }`

#### Programs
**2. List All Programs**
*   **GET** `/programs`
*   **Query**: `search`, `status`, `page`, `limit`
*   **Response**: Returns *all* programs (Drafts, Scheduled, Published) for management.

**3. Get Program Details**
*   **GET** `/programs/:id`
*   **Response**: Full program object, including all terms, lessons, and assets.

**4. Create Program**
*   **POST** `/programs`
*   **Body**: `{ "title": "New Course", "language_primary": "en" }`

**5. Update Program**
*   **PATCH** `/programs/:id`
*   **Body**:
    ```json
    {
      "title": "Updated Title",
      "topics": ["Tech", "Design"],
      "assets": { "posters": { "en": { "portrait": "https://..." } } }
    }
    ```

**6. Add Term**
*   **POST** `/programs/:id/terms`
*   **Body**: `{ "title": "Term 1", "term_number": 1 }`

#### Lessons
**7. Get Lesson Details**
*   **GET** `/lessons/:id`

**8. Create Lesson**
*   **POST** `/terms/:term_id/lessons`
*   **Body**: `{ "title": "Intro", "lesson_number": 1, "content_type": "video" }`

**9. Update Lesson Content**
*   **PATCH** `/lessons/:id`
*   **Body**: Updates title, assets (thumbnails), content URLs.

**10. Publish / Schedule Lesson**
*   **PATCH** `/lessons/:id/status`
*   **Body (Schedule)**:
    ```json
    {
      "status": "scheduled",
      "publish_at": "2026-02-01T12:00:00Z"
    }
    ```
*   **Body (Publish Now)**: `{ "status": "published" }`

#### Metadata
**11. List Topics**
*   **GET** `/topics`
*   **Response**: `[{ "id": 1, "name": "Business" }, ...]`

---

## 🧪 Verification & Demo Flow

To demonstrate the system capabilities to an evaluator, follow this flow:

### Step 1: Login
Go to [http://localhost](http://localhost) and login as `editor@example.com` / `password123`.

### Step 2: Create Scheduled Content
1.  Open the **"UX Design"** program.
2.  Select an existing Draft lesson (e.g., "Wireframing").
3.  Scroll to the **Scheduling** box.
4.  Pick a time **1 or 2 minutes in the future**.
5.  Click **Save**.
6.  *Observation*: The status badge changes to `Scheduled`.

### Step 3: Verify Worker Action
1.  Wait for your chosen time to pass.
2.  Wait an extra 60 seconds (max) for the worker loop to trigger.
3.  **Refresh the Page**.
4.  *Observation*: The status badge is now **Published** (Green).

### Step 4: Verify Public Visibility
1.  Open a new tab to [http://localhost:3000/api/catalog/programs](http://localhost:3000/api/catalog/programs).
2.  *Observation*: The Program (which was previously hidden if it had no published lessons) should now appear in the JSON response, because the worker successfully published its lesson.

---

## 🛠 Manual Ops Commands

If you need to debug or reset the environment:

**Tail Worker Logs**:
```bash
docker compose -f docker-compose.prod.yml logs -f worker
```

**Access Database Shell**:
```bash
docker compose -f docker-compose.prod.yml exec db psql -U admin -d cms_core
```

**Full Reset (Nuke & Restart)**:
```bash
docker compose down -v
docker compose -f docker-compose.prod.yml up --build -d
```
"# cms-chaishots" 
"# cms-chaishots" 
