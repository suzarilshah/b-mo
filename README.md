# B-mo - Enterprise AI Accounting Platform

An enterprise-grade, multi-tenant AI Accounting and Management platform built with modern technologies.

## Features

- 🧠 **AI-Powered Document Intelligence** - Automatic OCR and extraction using Azure Document Intelligence
- 📊 **Financial Forecasting** - LSTM-powered predictions for sales, revenue, and KPIs
- 💬 **Natural Language Search** - GPT-5 powered RAG chat for querying financial data
- 📈 **Financial Reports** - Generate SOFP and SOPL reports with AI-powered summaries
- 🔐 **Enterprise Security** - Multi-tenant isolation with RBAC and audit trails
- 🔄 **Workflow Engine** - Multi-step approval processes
- 🔍 **Anomaly Detection** - ML-based detection of unusual transactions
- 💰 **Bank Reconciliation** - AI-powered matching and reconciliation

## Tech Stack

- **Frontend**: Vite + React + TypeScript + TanStack Router
- **UI**: ShadCN UI + Tailwind CSS
- **Backend**: Appwrite (Auth, Storage, Functions)
- **Database**: NeonDB (PostgreSQL with pgvector)
- **AI Services**: Azure Document Intelligence, GPT-5, embed-v-4-0
- **Charts**: Recharts

## Setup

### Prerequisites

- Node.js 18+ and npm
- Appwrite instance (self-hosted or cloud)
- NeonDB database
- Azure account with Document Intelligence, AI Foundry access

### Environment Variables

Create a `.env` file in the root directory:

```env
# Azure Services
VITE_AZURE_EMBEDDINGS_ENDPOINT=your_embeddings_endpoint
VITE_AZURE_EMBEDDINGS_API_KEY=your_embeddings_key
VITE_AZURE_EMBEDDINGS_MODEL=embed-v-4-0
VITE_AZURE_EMBEDDINGS_DIMENSIONS=1536

VITE_AZURE_GPT5_ENDPOINT=your_gpt5_endpoint
VITE_AZURE_GPT5_API_KEY=your_gpt5_key

VITE_AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT=your_doc_intelligence_endpoint
VITE_AZURE_DOCUMENT_INTELLIGENCE_KEY=your_doc_intelligence_key
VITE_AZURE_DOCUMENT_INTELLIGENCE_REGION=your_region

# Appwrite
VITE_APPWRITE_ENDPOINT=https://your-appwrite-instance.com/v1
VITE_APPWRITE_PROJECT_ID=your_project_id
VITE_APPWRITE_API_KEY=your_api_key
VITE_APPWRITE_BUCKET_ID=your_bucket_id

# NeonDB
VITE_NEON_DATABASE_URL=postgresql://user:password@host/database
VITE_NEON_API_KEY=your_api_key
```

### Database Setup

1. Run the schema migration:

```bash
psql $VITE_NEON_DATABASE_URL -f database/schema.sql
```

2. (Optional) Seed initial data:

```bash
psql $VITE_NEON_DATABASE_URL -f database/seed.sql
```

### Install Dependencies

```bash
npm install
```

### Development

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Build

```bash
npm run build
```

The production build will be in the `dist` directory.

### Preview Production Build

```bash
npm run preview
```

## Project Structure

```
B-Mo/
├── src/
│   ├── components/     # React components
│   ├── lib/            # Utilities and integrations
│   ├── routes/         # TanStack Router routes
│   ├── hooks/         # Custom React hooks
│   └── index.css      # Global styles
├── database/           # Database schemas and migrations
├── appwrite/           # Appwrite serverless functions
└── public/             # Static assets
```

## Key Features Implementation

### Document Intelligence Pipeline
- Upload documents to Appwrite Storage
- Process with Azure Document Intelligence OCR
- Generate embeddings using embed-v-4-0
- Store embeddings in pgvector for semantic search
- Route to approval workflows based on confidence

### RAG Chat Interface
- Convert queries to embeddings
- Search documents and transactions using vector similarity
- Build context from search results
- Generate responses using GPT-5 with context

### Financial Reports
- Generate Statement of Financial Position (SOFP)
- Generate Statement of Profit or Loss (SOPL)
- Export to PDF, Excel, or CSV
- AI-powered report summarization

### Forecasting
- LSTM-based time-series forecasting
- Visualize predictions with confidence intervals
- GPT-5 narrative summaries

## License

MIT
