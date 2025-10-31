# B-mo Deployment Guide

## Local Development Setup

### Quick Start

1. **Clone and Install**
   ```bash
   cd B-Mo
   npm install
   ```

2. **Configure Environment Variables**
   
   Create a `.env` file in the root directory:
   ```env
   # Azure Services
   VITE_AZURE_EMBEDDINGS_ENDPOINT=your_endpoint
   VITE_AZURE_EMBEDDINGS_API_KEY=your_key
   VITE_AZURE_EMBEDDINGS_MODEL=embed-v-4-0
   VITE_AZURE_EMBEDDINGS_DIMENSIONS=1536
   
   VITE_AZURE_GPT5_ENDPOINT=your_endpoint
   VITE_AZURE_GPT5_API_KEY=your_key
   
   VITE_AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT=your_endpoint
   VITE_AZURE_DOCUMENT_INTELLIGENCE_KEY=your_key
   VITE_AZURE_DOCUMENT_INTELLIGENCE_REGION=your_region
   
   # Appwrite
   VITE_APPWRITE_ENDPOINT=https://your-appwrite.com/v1
   VITE_APPWRITE_PROJECT_ID=your_project_id
   VITE_APPWRITE_API_KEY=your_api_key
   VITE_APPWRITE_BUCKET_ID=your_bucket_id
   
   # NeonDB
   VITE_NEON_DATABASE_URL=postgresql://user:pass@host/db
   VITE_NEON_API_KEY=your_api_key
   ```

3. **Setup Database**
   ```bash
   # Run schema migration
   psql $VITE_NEON_DATABASE_URL -f database/schema.sql
   
   # (Optional) Seed data
   psql $VITE_NEON_DATABASE_URL -f database/seed.sql
   ```

4. **Start Development Server**
   ```bash
   # Option 1: Use the startup script
   ./start.sh
   
   # Option 2: Use npm directly
   npm run dev
   ```

5. **Access the Application**
   - Open http://localhost:5173 in your browser
   - Register a new account or login

### Database Setup

1. **Create NeonDB Database**
   - Sign up at https://neon.tech
   - Create a new project
   - Copy the connection string

2. **Run Migrations**
   ```bash
   psql $VITE_NEON_DATABASE_URL -f database/schema.sql
   ```

3. **Enable pgvector Extension**
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   ```

### Appwrite Setup

1. **Install Appwrite** (Self-hosted or Cloud)
   - Cloud: https://cloud.appwrite.io
   - Self-hosted: https://appwrite.io/docs/installation

2. **Create Project**
   - Create a new project in Appwrite Console
   - Note your Project ID

3. **Create Storage Bucket**
   - Go to Storage > Create Bucket
   - Set bucket ID and permissions
   - Copy Bucket ID to `.env`

4. **Configure Storage Bucket Permissions**
   
   The storage bucket must allow authenticated users to upload and read files. Follow these steps:
   
   **In Appwrite Console:**
   1. Go to Storage > Your Bucket > Settings
   2. Under **Permissions**, set the following:
      - **Create**: `users` (allows all authenticated users to upload files)
      - **Read**: `users` (allows all authenticated users to read/download files)
      - **Update**: `users` (optional, for file metadata updates)
      - **Delete**: `users` (optional, for file deletion)
   3. Under **File Security**:
      - Enable file encryption (recommended for production)
      - Set maximum file size (e.g., 10MB for documents)
      - Configure allowed file extensions: `.pdf`, `.jpg`, `.jpeg`, `.png`, `.tiff`
   
   **Important**: Without proper Create permissions, users will receive "not authorized" errors when uploading documents.

4. **Configure Authentication**
   - Enable Email/Password authentication
   - Set up domain for OAuth (optional)

5. **Create API Key**
   - Go to Settings > API Keys
   - Create key with full permissions
   - Copy to `.env`

### Azure Services Setup

1. **Azure Document Intelligence**
   - Create resource in Azure Portal
   - Get endpoint and API key
   - Add to `.env`

2. **Azure AI Foundry (GPT-5)**
   - Create AI Foundry resource
   - Deploy GPT-5 model
   - Get endpoint and API key
   - Add to `.env`

3. **Azure Embeddings (embed-v-4-0)**
   - Deploy embed-v-4-0 model
   - Get endpoint and API key
   - Add to `.env`

## Production Deployment

### Build for Production

```bash
npm run build
```

The production build will be in the `dist` directory.

### Deploy to Vercel

1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Deploy:
   ```bash
   vercel
   ```

3. Add environment variables in Vercel dashboard

### Deploy to Netlify

1. Install Netlify CLI:
   ```bash
   npm i -g netlify-cli
   ```

2. Deploy:
   ```bash
   netlify deploy --prod
   ```

3. Add environment variables in Netlify dashboard

### Deploy to Self-Hosted Server

1. Build the application:
   ```bash
   npm run build
   ```

2. Copy `dist` directory to your server

3. Serve with Nginx:
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       
       root /path/to/dist;
       index index.html;
       
       location / {
           try_files $uri $uri/ /index.html;
       }
   }
   ```

## Environment Variables Reference

### Required Variables

- `VITE_AZURE_EMBEDDINGS_ENDPOINT` - Azure embeddings endpoint
- `VITE_AZURE_EMBEDDINGS_API_KEY` - Azure embeddings API key
- `VITE_AZURE_GPT5_ENDPOINT` - GPT-5 endpoint
- `VITE_AZURE_GPT5_API_KEY` - GPT-5 API key
- `VITE_AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT` - Document Intelligence endpoint
- `VITE_AZURE_DOCUMENT_INTELLIGENCE_KEY` - Document Intelligence API key
- `VITE_APPWRITE_ENDPOINT` - Appwrite endpoint
- `VITE_APPWRITE_PROJECT_ID` - Appwrite project ID
- `VITE_APPWRITE_API_KEY` - Appwrite API key
- `VITE_APPWRITE_BUCKET_ID` - Appwrite storage bucket ID
- `VITE_NEON_DATABASE_URL` - NeonDB connection string
- `VITE_NEON_API_KEY` - NeonDB API key

### Optional Variables

- `VITE_AZURE_EMBEDDINGS_MODEL` - Embedding model (default: embed-v-4-0)
- `VITE_AZURE_EMBEDDINGS_DIMENSIONS` - Embedding dimensions (default: 1536)
- `VITE_AZURE_DOCUMENT_INTELLIGENCE_REGION` - Azure region

## Troubleshooting

### Database Connection Issues

- Verify connection string format
- Check network connectivity
- Ensure pgvector extension is enabled

### Azure API Errors

- Verify API keys and endpoints
- Check rate limits and quotas
- Review Azure service logs

### Appwrite Connection Issues

- Verify endpoint URL
- Check API key permissions
- Ensure CORS is configured

### Build Errors

- Clear node_modules and reinstall
- Check Node.js version (18+ required)
- Review TypeScript errors

## Support

For issues or questions:
- Check the README.md
- Review error logs
- Check service documentation (Azure, Appwrite, NeonDB)

