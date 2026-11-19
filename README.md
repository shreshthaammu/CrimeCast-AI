# CrimeCast AI

**Predictive Crime Intelligence & Risk Analytics Platform**

CrimeCast AI is a professional investigator console built for operational use across complaint intake, transaction analysis, risk scoring, and authorized investigative review.

> Crime complaint → transaction intelligence → pattern detection → risk analysis → geographic prediction → actionable intelligence → authorized investigator → human verification

The platform is designed for decision support in controlled environments and should be used with validated, authorized data and human review at each critical decision point.

## What is implemented

The project includes a dark, responsive investigator workspace with a persistent command sidebar, role toggle between investigator and analyst modes, synthetic KPI cards, an interactive zone-level risk map, selectable risk zones, explainable prediction factors, alert queue, complaint queue, case queue, model health card, trend visualization, end-to-end early warning timeline, and a safe synthetic simulation modal.

The server exposes typed tRPC procedures for the intelligence snapshot, alert status updates, case creation, and simulation runs. Mutations return a success response that the UI uses to show feedback and demonstrate the workflow. The current snapshot is deterministic in-memory demo data so the application can start without a configured production database.

## Folder structure

```text
crimecast-ai/
├── client/
│   ├── index.html
│   └── src/
│       ├── components/       # Shared UI primitives and application layout
│       ├── contexts/         # Theme provider
│       ├── lib/trpc.ts       # Typed client contract
│       ├── pages/Home.tsx    # CrimeCast investigator console
│       ├── pages/NotFound.tsx
│       ├── App.tsx           # Routes and providers
│       └── index.css         # Product theme and layout styles
├── data/
│   ├── complaints.csv       # Small anonymized synthetic fixture
│   └── risk_zones.csv       # Zone-level synthetic feature fixture
├── drizzle/
│   └── schema.ts            # WebDev database schema entry point
├── server/
│   ├── routers.ts           # Intelligence procedures and deterministic demo dataset
│   ├── db.ts                # Database helper scaffold
│   └── _core/               # WebDev runtime, OAuth, tRPC, and Vite bridge
├── README.md
└── package.json
```

## Installation and running

The project uses the WebDev full-stack scaffold (React, Vite, Tailwind CSS, Express, tRPC, Drizzle, and Manus OAuth plumbing).

```bash
npx pnpm install
npx pnpm dev
```

The WebDev preview starts on the configured project URL. For a production bundle:

```bash
npx pnpm check
npx pnpm build
npx pnpm start
```

## Environment variables

Copy `.env.example` to a real `.env` file and populate the required values before deployment:

```bash
copy .env.example .env
```

Required values:

- `JWT_SECRET` — secret used by the app session/auth layer
- `DATABASE_URL` — database connection string if you enable persistence
- `OAUTH_SERVER_URL` — OAuth provider URL for Manus auth
- `OWNER_OPEN_ID` — owner identity for the configured OAuth flow
- `VITE_APP_ID` — frontend app identifier if needed by the client runtime
- `BUILT_IN_FORGE_API_URL` — external generation API URL if enabled
- `BUILT_IN_FORGE_API_KEY` — external API key if enabled
- `CORS_ORIGINS` — allowed frontend origins in production

## Production deployment

This app is a full-stack Node/Express service with a Vite frontend. It should be deployed as one web service, not as a pure static frontend.

### Render deployment

Recommended Render config:

- Build command: `npx pnpm install && npx pnpm build`
- Start command: `npx pnpm start`

A basic `render.yaml` is included in the repository root for this project.

### Local production check

```bash
npx pnpm build
npx pnpm start
```

The app will run on the first free port starting from `3000` and may fall back to `3001+` if the default port is already taken.

## Database setup

The scaffold is database-ready through Drizzle and the preconfigured `DATABASE_URL` environment variable. This demo intentionally does not require a database to render its deterministic synthetic snapshot. To move the demo data into persistence, add complaint, transaction, zone, prediction, alert, case, model-run, and audit-log tables to `drizzle/schema.ts`, generate a migration, and run:

```bash
pnpm db:push
```

No real personal information should be inserted. Use hashed identifiers and minimum-necessary fields only.

## Demo dataset

The checked-in CSV fixtures in `data/` are safe, synthetic examples. They use `Demo District`, `Demo State`, fictional identifiers, and the `SYNTHETIC DEMO` label. A production ingestion route should validate columns, timestamps, coordinates, duplicates, missing values, and schema drift before persistence.

## API documentation

All procedures are exposed under the WebDev tRPC endpoint at `/api/trpc`.

| Procedure | Type | Purpose |
|---|---|---|
| `intelligence.snapshot` | Query | Returns KPIs, zones, alerts, complaints, transactions, trends, model metrics, cases, and audit samples. |
| `intelligence.updateAlert` | Mutation | Demonstrates a human-reviewed alert status update. |
| `intelligence.createCase` | Mutation | Demonstrates opening a case from a selected prediction zone. |
| `intelligence.runSimulation` | Mutation | Generates a clearly labeled synthetic scenario from complaints, time window, volume, zone, and pattern. |
| `auth.me` | Query | Reads the current WebDev auth user when available. |
| `auth.logout` | Mutation | Clears the scaffolded session cookie. |

## ML methodology shown in the prototype

The interface communicates a zone-level approach rather than pretending to identify an exact ATM. A geographic grid is scored using synthetic historical fraud density, recent complaint density, transaction activity, ATM density, temporal activity, and anomaly-like velocity signals. Scores are normalized to a 0–100 range and mapped to the categories LOW (0–25), MEDIUM (26–50), HIGH (51–75), and CRITICAL (76–100).

The explanation panel surfaces the contributing factors and a confidence value. The model card uses metrics labeled as **demo metrics** and should only be populated with actual evaluation results after a real training/evaluation pipeline is connected. The current displayed values are static synthetic showcase values, not claims about model quality.

A production training command can be added as a server-side job or external Python service, for example:

```bash
# future integration point; not executed by this demo
python -m ml.train --input data/features.csv --target withdrawal_zone
```

Recommended evaluation includes precision, recall, F1, ROC-AUC where appropriate, top-1/top-3 zone accuracy, mean geographic error, coverage, calibration, and false-positive rate. If there is insufficient labeled data, the UI should say so rather than fabricate metrics.

## Operational workflow

1. Open the live overview and point out the synthetic-data banner.
2. Select `H03` on the risk map and explain the 88% zone-level score, 84% confidence, historical similarity, and four contributing factors.
3. Click the alert queue entry `ALT-2048` to show the alert-to-prediction link.
4. Click **Run simulation**, choose a complaint count, time window, volume, zone, and fraud pattern, then run the scenario.
5. Show the generated result labeled `NOT REAL-WORLD INTELLIGENCE`.
6. Use the investigation action to create a case and explain that the action is a human-review queue, not an automated enforcement action.
7. Use the sidebar to show complaints, transactions, cases, analytics, models, and audit-log destinations as the architecture expands.

## Demo accounts

The interface uses fictional identity presentation for the prototype:

- `admin@cybertrace.demo`
- `investigator@cybertrace.demo`
- `analyst@cybertrace.demo`

These are display-only demo identities in the current console. Production authentication should use the scaffolded OAuth flow, role-based authorization, password hashing where local credentials are introduced, rate limiting, secure cookies, environment-managed secrets, and auditable access controls.

## Privacy and safety

This is decision support only. The system must never accuse a person, trigger enforcement automatically, or expose unnecessary personal information. Real deployments require authorized data agreements, access controls, retention policies, incident response, model governance, fairness testing, secure API validation, audit logs, and human review.

The application intentionally does not claim live banking alerts, ATM transaction feeds, government data, police data, real-time streaming, SMS/email actions, or exact ATM predictions. Those are architecture-ready future extensions only.

## Known limitations

The snapshot is deterministic and in memory, so changes are demonstration responses rather than durable records. The geographic display is a purpose-built zone visualization rather than a live GIS or map-tile integration. The model metrics and confidence values are synthetic showcase values. The separate analyst pages currently route into the shared console shell while the sidebar communicates the intended product surface.

## Roadmap

- Persist complaint, transaction, prediction, case, alert, model-run, and audit records in Drizzle.
- Add validated CSV upload with preview, schema checks, missing-value and coordinate diagnostics.
- Connect an authorized feature store and reproducible Python training pipeline.
- Add calibrated zone ranking, DBSCAN/graph clustering, time-series forecasting, SHAP-style feature attribution, and uncertainty intervals.
- Add GIS layers and authorized, privacy-preserving partner feeds.
- Add model registry, approval workflow, false-positive feedback loops, retention controls, and role-specific permissions.

## License

Operational use only. Do not upload real victim, bank-account, phone-number, or personally identifiable information into the platform without approved controls and governance.
