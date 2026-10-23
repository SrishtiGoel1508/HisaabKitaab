# Hisaab Kitaab — AI-Powered Bookkeeping for Kirana Stores 🧾🛒

**Hisaab Kitaab** is an AI-powered receipt digitization, expense management, and bookkeeping web application designed specifically for small Indian businesses, kirana stores, and neighborhood retailers.

---

## 1. Core Architectural Principle

> **"Gemini interprets information. The backend owns the financial truth."**

- **Gemini AI** is used exclusively for receipt document text extraction, suggesting candidate line items, inferring tentative expense categories, and explaining verified figures in plain retail language.
- **Deterministic TypeScript Backend** strictly owns data validation, receipt status lifecycle, persistent database storage, duplicate candidate detection, integer-paise financial calculations, date filtering, category aggregations, and CSV generation.
- **Decimal-Safe Financial Arithmetic:** All monetary amounts are internally represented as exact integer paise (e.g. ₹125.50 = `12550` paise) or handled with `decimal.js` to eliminate JavaScript floating-point errors (`0.1 + 0.2 = 0.30000000000000004`).
- **Audit & Evidence Traceability:** Every dashboard number, category summary, and natural-language query response is 100% traceable to specific persisted, confirmed receipt IDs.

---

## 2. Technology Stack

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, Lucide React, Recharts.
- **Backend:** Node.js 24, TypeScript, Express.js, Zod runtime validation, Multer multipart upload.
- **AI Integration:** Official Google Gen AI SDK (`@google/genai`) with configurable models (`gemini-2.5-flash`).
- **Database & ORM:** Prisma ORM with SQLite for zero-friction local and persistent container storage, fully compatible with Cloud SQL PostgreSQL.
- **Testing:** Vitest with Supertest for end-to-end HTTP integration tests and unit tests.

---

## 3. Project Structure

```
hisaab-kitaab/
├── prisma/
│   └── schema.prisma                # Relational schema (Business, Receipt, LineItems, Categories, Duplicates)
├── data/
│   ├── uploads/                     # Persistent storage for uploaded receipts
│   └── synthetic-fixtures/          # 20 pre-generated kirana receipt documents (SVG)
├── src/
│   ├── client/                      # React frontend
│   │   ├── components/              # Navbar, StatusBadge, ReceiptDetailModal
│   │   ├── pages/                   # Dashboard, Receipts, Upload, Analytics, AskAI, Categories
│   │   ├── services/                # Typed REST API client
│   │   └── utils/                   # Currency & date formatters
│   ├── server/                      # Express.js REST API
│   │   ├── config/                  # Server configuration and environment variables
│   │   ├── controllers/             # Receipt, Analytics, Category, Export controllers
│   │   ├── middleware/              # Multer upload validation middleware
│   │   ├── repositories/            # Transactional Prisma repositories
│   │   ├── routes/                  # Versioned API routes (/api/v1/...)
│   │   ├── services/                # Gemini, Validation, Duplicate, Analytics, CSV services
│   │   └── utils/                   # Currency, Prisma singleton
│   └── shared/                      # Shared types and Zod schemas
├── scripts/
│   ├── syntheticReceiptDefinitions.ts# 20 realistic kirana receipt definitions with edge cases
│   ├── generateSyntheticReceipts.ts # SVG document generator for receipts
│   └── seedDemoData.ts              # Reproducible, idempotent seed script
├── tests/
│   ├── unit/                        # Currency, validation, duplicate detection, CSV security
│   └── integration/                 # End-to-end REST API integration tests
├── Dockerfile                       # Production multi-stage Docker build for Cloud Run
├── .env.example                     # Environment variables template
└── README.md
```

---

## 4. Local Setup & Quickstart

### Prerequisites
- Node.js v20+ (Node v24 recommended)
- npm v10+

### Step-by-Step Installation

1. **Clone or navigate to the project directory:**
   ```bash
   cd "C:\Users\Srishti Goel\.gemini\antigravity\scratch\hisaab-kitaab"
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env` file from `.env.example`:
   ```bash
   cp .env.example .env
   ```
   Add your Gemini API key (optional for synthetic demo/tests, required for live AI OCR):
   ```env
   PORT=5000
   NODE_ENV=development
   DATABASE_URL="file:./dev.db"
   GEMINI_API_KEY=your_gemini_api_key_here
   GEMINI_MODEL=gemini-2.5-flash
   MAX_UPLOAD_SIZE_MB=10
   STORAGE_DIR=./data/uploads
   DEMO_BUSINESS_ID=demo-kirana-store-001
   DEMO_BUSINESS_NAME="Gupta Kirana & General Store"
   ```

4. **Initialize Database and Seed Demo Kirana Data:**
   ```bash
   npx prisma db push
   npm run seed
   ```

5. **Run the Application:**
   ```bash
   # Starts Express backend on :5000 and Vite dev server on :3000
   npm run dev
   ```
   Open your browser at `http://localhost:3000`.

---

## 5. Demonstration Walkthrough (Section 25)

The application comes pre-loaded with **20 synthetic kirana receipts** for `Gupta Kirana & General Store`:

1. **Upload a Receipt:**
   - Click **"Upload Receipt"** or drag a file into the upload zone.
   - The file is saved, hashed (SHA-256), and sent to Gemini.
   - Line items, vendor, tax, and totals are extracted automatically.
2. **Correct an Extraction Error:**
   - Open receipt `syn-rec-010` (Kedia Steam Flour Mills). Notice the yellow **"Needs Review"** badge because the date stamp is missing.
   - Try clicking **"Confirm Receipt"** — notice the backend strictly blocks confirmation.
   - Enter `2026-10-14` in the date field, click **"Save Changes"**, and now click **"Confirm Receipt"**. The receipt immediately transitions to **"Confirmed"**.
3. **Review a Suspected Duplicate:**
   - Notice receipt `syn-rec-011` has an amber **"Duplicate Match"** badge matching `syn-rec-001`.
   - Open the receipt to see the detected reasons (exact SHA-256 hash or matching vendor/date/total).
   - Click **"Dismiss False Positive"** to unflag it without deleting the record.
4. **Confirm Records & Enforce Eligibility:**
   - Only confirmed receipts count toward financial totals.
   - Receipts in `draft` or `needs_review` are strictly excluded from spending summaries.
5. **Generate a Spending Summary & Trace Evidence:**
   - Navigate to **"Spending Analytics"**.
   - Select an accounting period (e.g. *This Month*).
   - Click on any category (e.g. **Dairy Products**).
   - In the right-hand panel, inspect the exact contributing receipt IDs and click **"Inspect"** to view the source bill!
6. **Ask Hisaab Kitaab (Natural Language AI Assistant):**
   - Click **"Ask Hisaab Kitaab"**.
   - Click one of the quick pills or ask: *"Which category accounts for the most spending this month?"*
   - The backend deterministically executes the query, collects the exact evidence receipt IDs, and passes verified numbers to Gemini for a plain-language explanation.
7. **Export Confirmed Book to CSV:**
   - Click **"Export CSV"** in the top navigation.
   - The generated CSV file includes all confirmed line items and totals, fully protected against spreadsheet formula injection attacks.
8. **Verify Persistence:**
   - Restart the server: previously confirmed receipts, line item edits, and uploaded documents remain intact in the database and `data/uploads/`.

---

## 6. Deliberate Edge Cases in Demonstration Dataset

| ID | Vendor | Condition | Behavior / Review Flag |
| :--- | :--- | :--- | :--- |
| `syn-rec-001` | Amul Dairy Distributors | Normal Readable | Confirmed, ₹3,360.00 |
| `syn-rec-009` | Kaveri Provisions | Blurry Receipt | Flagged with low confidence warnings |
| `syn-rec-010` | Kedia Steam Flour Mills | Missing Date | Flagged with missing date, blocks confirmation until entered |
| `syn-rec-011` | Amul Dairy Distributors | Deliberate Duplicate | Duplicate candidate linked to `syn-rec-001` (exact file hash match) |
| `syn-rec-012` | Parle Agenci Distrbutor | Inconsistent Spelling | Demonstrates fuzzy vendor normalization |
| `syn-rec-013` | Laxmi Wholesale Traders | Math Discrepancy | Items sum to ₹4,500.00 but printed total is ₹5,000.00 (blocks confirmation) |
| `syn-rec-014` | City Sundry Bazaar | Unclear Category | Automatically categorized to `Uncategorized` fallback |
| `syn-rec-015` | Mahalaxmi Pulses Depot | Missing Total | Torn receipt corner, total missing (blocks confirmation) |

---

## 7. REST API Reference (`/api/v1`)

### Receipts
- `POST /api/v1/receipts/upload`: Accepts multipart image/PDF, saves file, runs Gemini extraction, validates, returns receipt DTO.
- `GET /api/v1/receipts`: Lists receipts with pagination, status, vendor, and date filters.
- `GET /api/v1/receipts/:id`: Returns receipt details, line items, flags, and duplicate matches.
- `PATCH /api/v1/receipts/:id`: Updates fields/items; invalidates prior confirmation if materially edited.
- `POST /api/v1/receipts/:id/confirm`: Enforces preconditions and confirms eligible receipt.
- `DELETE /api/v1/receipts/:id`: Soft-deletes receipt, removing it from calculations.
- `GET /api/v1/receipts/:id/file`: Streams original uploaded receipt file.
- `POST /api/v1/receipts/:id/duplicates/:candidateId/dismiss`: Dismisses false-positive duplicate candidate.

### Analytics & Queries
- `GET /api/v1/analytics/summary`: Returns total confirmed spending, counts, category and vendor breakdowns with supporting IDs.
- `POST /api/v1/analytics/query`: Accepts `{ "question": "..." }`, runs deterministic query, synthesizes AI explanation with evidence.

### Export
- `GET /api/v1/export/receipts.csv`: Streams confirmed bookkeeping records as RFC 4180 CSV with formula injection protection.

---

## 8. Automated Tests

Run the full test suite (26 unit and integration tests):
```bash
npm test
```

### Test Coverage Highlights:
- **Unit:** Exact integer paise conversion, `sumPaise`, floating point prevention, formula injection sanitization, string similarity & vendor normalization.
- **Integration:** Health check, category listings, receipt pagination, status filtering, file streaming, analytics calculations, natural language query answering, confirmation blocking rules, field update and resolution, invalid file rejection.

---

## 9. Google Cloud Run & Google AI Studio Deployment

The application is containerized with a production multi-stage Dockerfile and is fully compatible with **Google Cloud Run** and **Google AI Studio**.

### Deployment via Google Cloud SDK:

1. **Set your Google Cloud Project:**
   ```bash
   gcloud config set project YOUR_PROJECT_ID
   ```

2. **Deploy to Google Cloud Run:**
   ```bash
   gcloud run deploy hisaab-kitaab \
     --source . \
     --platform managed \
     --region asia-south1 \
     --allow-unauthenticated \
     --set-env-vars="NODE_ENV=production,GEMINI_MODEL=gemini-2.5-flash" \
     --set-secrets="GEMINI_API_KEY=GEMINI_API_KEY:latest"
   ```

3. **Persistent Storage on Cloud Run:**
   - For SQLite, attach a Google Cloud Storage bucket volume to `/app/data` using Cloud Run volume mounts (GCS FUSE):
     ```bash
     gcloud run services update hisaab-kitaab \
       --add-volume=name=hisaab-data,type=cloud-storage,bucket=YOUR_GCS_BUCKET \
       --add-volume-mount=volume=hisaab-data,mount-path=/app/data
     ```
   - Alternatively, connect Cloud SQL PostgreSQL by setting `DATABASE_URL="postgresql://user:password@/hisaab_db?host=/cloudsql/YOUR_INSTANCE_CONNECTION_NAME"` in Prisma.

### Google AI Studio Workflow:
- In Google AI Studio, import or synchronize this repository.
- Ensure the `GEMINI_API_KEY` secret is provided in the project environment settings.
- The build script (`npm run build`) bundles the Vite React app and compiles the Express backend seamlessly.

---

## 10. Security & Data Integrity Guarantees

1. **Prompt Injection Defense:** Receipt text is treated strictly as passive data and never as executable system instructions.
2. **Formula Injection Sanitization:** Spreadsheet cells starting with `=`, `+`, `-`, `@`, `\t`, `\r` are prefixed with a single quote `'` in CSV exports.
3. **No Frontend Secrets:** Gemini API keys, database paths, and cloud credentials remain exclusively on the server and are never included in browser bundles.
4. **Authoritative Backend Truth:** Numerical totals cannot be modified, overridden, or hallucinatory generated by Gemini.
