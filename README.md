# GrowEasy AI CRM CSV Importer

An enterprise-grade, high-performance **Clean Architecture** system designed to ingest arbitrary CSV files, semantically map unpredictable column layout structures to a standardized CRM Lead schema using LLMs (supporting both OpenAI and Groq), validate and normalize data using strict Zod schemas, and stream progress indicators to a Next.js client in real-time.

---

## 📖 Project Overview

When importing marketing and sales leads from varied ad channels (Facebook Lead Ads, Google Ads, Real Estate portals, landing pages, etc.), developers face a common challenge: **arbitrary column names, randomized column order, missing headers, and inconsistent data formatting**.

The **GrowEasy AI CRM CSV Importer** resolves this by shifting the mapping problem from brittle string-matching rules to an **AI-powered semantic layout parser**. Utilizing LLMs via the OpenAI SDK, the system understands the semantic meaning of columns in a batch (e.g. mapping `WhatsApp` or `Cell` to `mobile`, and `Firm Name` to `company`), normalizes phone numbers and email syntaxes, and filters invalid rows—all while streaming batch-by-batch execution updates to a live frontend dashboard.

---

## ✨ Features

- **Semantic Field Mapping**: Leverages OpenAI (`gpt-4o-mini`) and Groq (`llama-3.1-8b-instant`) to map arbitrary headers to the CRM schema, handling column order randomization and nested details.
- **Unified Provider Abstraction**: Auto-detects Groq keys (prefixed with `gsk_`) vs. OpenAI keys, adjusting base endpoints and models dynamically.
- **Server-Sent Events (SSE)**: Establishes a persistent, real-time HTTP event stream to notify the frontend of progress, successes, and warning items without long-polling.
- **Zod Data Normalization**: Parses and cleans phone numbers (retains digits and `+`), normalizes emails to lowercase, checks enums, and discards rows missing both critical contact points (email and mobile).
- **Concurrency & Backpressure Control**: Limits active LLM requests to `3` parallel workers, using a task queue with exponential backoff and jitter retry mechanisms to respect API rate limits.
- **Chunked Stream Upload**: Uses disk-backed multipart file buffers to parse large CSV files in chunks of 20 rows, keeping server memory consumption bounded at $O(1)$.
- **Interactive Local Preview**: Employs client-side PapaParse parsing to let users view, filter, and search a 10-row sample table before committing to the AI import.
- **Stunning Dark Theme**: Implements a forced dark-mode hued theme featuring a premium **Indigo-Rose color palette**, glassmorphic card overlays, and subtle glowing backdrop orbs.

---

## 🏗️ System Architecture

This system is built using **Clean Architecture** principles. The domain logic is completely isolated from frameworks, databases, and third-party API SDK wrappers.

```
                         ┌───────────────────────────────┐
                         │      Next.js Frontend SPA    │
                         └───────────────┬───────────────┘
                                         │
                                         │ 1. POST /api/import (Multipart File)
                                         │ 2. GET /api/import (SSE Stream)
                                         ▼
                         ┌───────────────────────────────┐
                         │     Express HTTP Gateway      │
                         └───────────────┬───────────────┘
                                         │
                                         ▼
                         ┌───────────────────────────────┐
                         │   Import Controller Router    │
                         └───────────────┬───────────────┘
                                         │
                                         ▼
                         ┌───────────────────────────────┐
                         │   Import Coordinator Service  │
                         └──────┬─────────────────┬──────┘
                                │                 │
        (Batch Size = 20 Rows)  │                 │ (Validate, Clean, Normalise)
                                ▼                 ▼
                         ┌─────────────┐   ┌─────────────┐
                         │  LLM Mapper │   │ Zod Validate│
                         │   Service   │   │   Service   │
                         └──────┬──────┘   └──────┬──────┘
                                │                 │
            (Structured Output) │                 │ (In-Memory Database)
                                ▼                 ▼
                         ┌─────────────┐   ┌─────────────┐
                         │ OpenAI/Groq │   │    Lead     │
                         │ API Client  │   │ Repository  │
                         └─────────────┘   └─────────────┘
```

---

## 📁 Folder Structure

```
/ (Workspace Root)
├── docker-compose.yml              # Local multi-container orchestrator
├── README.md                       # Developer-focused documentation
├── screenshots/                    # UI reference images
│   ├── dark_preview.png            # Forced Dark Theme Dashboard Preview
│   └── light_preview.png           # Forced Dark Theme Preview (Local Table)
├── backend/                        # Express + TypeScript Server
│   ├── Dockerfile                  # Production container builder
│   ├── package.json                # Dependencies (openai, zod, multer, pino)
│   ├── tsconfig.json               # Strict compiler rules
│   ├── vitest.config.ts            # Test suite execution options
│   ├── .env                        # Active environment configurations
│   └── src/
│       ├── app.ts                  # Express application setup (Cors, routes)
│       ├── server.ts               # Listener entry point
│       ├── config/                 # Env validator, CORS options, Pino logger
│       ├── middleware/             # Rate limiters, upload buffers, logs
│       ├── controllers/            # Controller layers writing SSE responses
│       ├── routes/                 # Express API routing mappings
│       ├── services/               # Isolated domain logic (CSV, LLM, validation)
│       ├── repositories/           # Leads mock database interface
│       ├── utils/                  # Jittered retry backoffs, concurrency queues
│       ├── prompts/                # Dedicated system prompts
│       ├── types/                  # Shared TypeScript interfaces
│       └── tests/                  # Unit and integration test suites
└── frontend/                       # Next.js App Router Client
    ├── Dockerfile                  # Next.js multi-stage container builder
    ├── package.json                # Dependencies (shadcn, react-query, zustand)
    ├── tailwind.config.js          # Tailored color system definitions
    └── src/
        ├── app/                    # Layout, landing page, globals.css
        ├── components/             # Providers, Uploader, preview, dashboard
        ├── hooks/                  # Custom react-query and streaming hooks
        ├── lib/                    # CSS class mergers
        └── store/                  # Zustand store for batch tracking
```

---

## ⚙️ Environment Variables

### Backend (`/backend/.env`)

| Variable | Description | Default | Required |
| :--- | :--- | :--- | :--- |
| `PORT` | Network port the Express server listens on. | `4000` | Yes |
| `NODE_ENV` | Application runtime environment (`development`, `production`, `test`). | `development` | Yes |
| `OPENAI_API_KEY` | Key for OpenAI (or Groq starts with `gsk_`). | - | Yes |
| `CORS_ORIGIN` | Allowed domains for CORS (comma-separated list). | `http://localhost:3000` | Yes |
| `MAX_FILE_SIZE_MB` | Ceiling size limit for incoming CSV uploads. | `10` | No |
| `DEFAULT_BATCH_SIZE`| Number of CSV rows packed per LLM batch. | `20` | No |

### Frontend (`/frontend/.env.local`)

| Variable | Description | Default | Required |
| :--- | :--- | :--- | :--- |
| `NEXT_PUBLIC_API_URL` | Root URL of the API Server gateway. | `http://localhost:4000` | Yes |

---

## 🚀 Setup Instructions

Ensure you have [Node.js v20+](https://nodejs.org) and [Docker](https://www.docker.com/) installed.

### Run Locally (Without Docker)

#### 1. Setup Backend
1. Navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure your API key in `/backend/.env` (Paste your OpenAI `sk-...` or Groq `gsk-...` key).
4. Start the backend:
   ```bash
   npm run dev
   ```
   *(Verify in your terminal that it logs either `isGroq: true` or `isGroq: false` correctly based on your key).*

#### 2. Setup Frontend
1. Open a new terminal and navigate to the frontend folder:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Next.js dev server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) in your browser.

#### 3. Run Test Suites
```bash
cd backend
npm run test
```

---

### Run using Docker Compose

To spin up both frontend and backend automatically:
```bash
# In workspace root
docker-compose up --build
```
- Frontend: [http://localhost:3000](http://localhost:3000)
- Backend: [http://localhost:4000](http://localhost:4000)

---

## 🔌 API Documentation

### `POST /api/import`
Uploads a CSV file, parses it on-the-fly, maps rows in batches using the LLM, validates, and streams progression events via Server-Sent Events (SSE).

- **Headers**: `Content-Type: multipart/form-data`
- **Body Form-Data**: `file` (a CSV file, max 10MB)
- **Response Headers**:
  ```http
  Content-Type: text/event-stream
  Cache-Control: no-cache, no-transform
  Connection: keep-alive
  X-Accel-Buffering: no
  ```

#### Stream Events Emitted:
1. **`connection_established`**
   ```json
   { "jobId": "uuid-v4-correlation-id" }
   ```
2. **`batch_progress`** (sent after each batch of 20 rows)
   ```json
   {
     "batchIndex": 1,
     "successCount": 18,
     "failureCount": 2,
     "totalProcessed": 20,
     "errors": [
       { "rowNumber": 4, "errors": ["email: Invalid email format"], "rowData": { "Name": "John" } }
     ]
   }
   ```
3. **`import_complete`** (sent upon finishing processing)
   ```json
   { "totalProcessed": 100, "totalSuccess": 95, "totalFailed": 5, "processingTimeMs": 14200 }
   ```

---

### `GET /api/import/leads`
Retrieves all currently stored leads from the CRM system database.

- **Response**: `200 OK`
  ```json
  {
    "status": "success",
    "results": 2,
    "data": [
      {
        "id": "uuid",
        "email": "richard@piedpiper.com",
        "mobile": "+15550199",
        "crm_note": "Interested in compression updates.",
        "lead_owner": "Richard Hendricks",
        "company": "Pied Piper",
        "lead_status": "GOOD_LEAD_FOLLOW_UP",
        "data_source": "leads_on_demand",
        "createdAt": "2026-07-08T10:00:00Z"
      }
    ]
  }
  ```

---

### `DELETE /api/import/leads`
Clears all leads from the temporary in-memory database store.

---

## 🧠 AI Prompt Strategy

The system relies on a **deterministic semantic mapping system** written in [`backend/src/prompts/crm.prompt.ts`](file:///c:/Users/User/Desktop/n/backend/src/prompts/crm.prompt.ts).

### Key Strategy Components:
1. **Header Identification Rules**: Instructions map ambiguous headers (e.g. `Client Email` $\rightarrow$ `email`, `WhatsApp`/`Contact` $\rightarrow$ `mobile`).
2. **Collateral Handling**: If a row contains multiple emails or phone numbers, the model is instructed to capture the first one as primary, and append secondary contacts to the `crm_note` field.
3. **Implicit Data Source Inference**: The model infers the `data_source` (e.g. `meridian_tower`, `eden_park`) based on markers or notes in the row.
4. **Semantic Status Mapping**: Inferred statuses are mapped to exact CRM enum states: `GOOD_LEAD_FOLLOW_UP`, `DID_NOT_CONNECT`, `BAD_LEAD`, or `SALE_DONE` based on descriptive remarks.
5. **No Hallucination Boundaries**: Mandatory requirements discard any record containing neither a mobile number nor an email address, filtering out noise.

---

## 📸 Screenshots

### Dashboard forced-dark mode interface with colorful highlights
![Dashboard Dark](/screenshots/dark_preview.png)

### Local Preview Table before committing to AI Mapping
![Local Preview Table](/screenshots/light_preview.png)

---

## 📦 Deployment Steps

To deploy this setup to a production environment (e.g. AWS ECS, GCP Cloud Run, or DigitalOcean App Platform):

1. **Docker Container Builds**:
   - The backend uses a multi-stage `Dockerfile` targeting Node 20 alpine which strips out devDependencies and caches modules.
   - The frontend `Dockerfile` runs a Next.js production build (`next build`) and exposes port 3000.
2. **Reverse Proxy Configuration**:
   - Ensure your load balancer/reverse proxy (Nginx or Cloudflare) supports **Server-Sent Events** by disabling response buffering (`proxy_set_header Connection ''; proxy_buffering off;`).
3. **Environment Setup**:
   - Store API keys using secrets managers (AWS Secrets Manager, Doppler, or GCP Secret Manager).
   - Set `NODE_ENV=production` on the backend container.

---

## 🔮 Future Improvements

1. **Distributed Queue System (BullMQ + Redis)**:
   - For files larger than 10MB (100,000+ rows), shift from in-memory processing to a distributed queue. The backend uploads to S3, posts a job to Redis, and worker instances process batches in the background.
2. **Persistent Database Store (PostgreSQL / Prisma)**:
   - Replace the in-memory repository mock with PostgreSQL, using indexing on `email` and `mobile` to handle deduplication at database level.
3. **User Column-Mapping Confirmation Screen**:
   - Allow the user to review the AI-suggested mappings first, correct any anomalies, and then execute the import batch.
