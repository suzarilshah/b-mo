# Database Schema

This directory contains the database schema and migration files for B-mo.

## Setup

1. Connect to your NeonDB instance
2. Run `schema.sql` to create all tables and extensions
3. (Optional) Run `seed.sql` for sample data

## Schema Overview

### Core Tables
- **companies**: Multi-tenant company records
- **users**: User accounts linked to companies and Appwrite Auth
- **roles**: RBAC role definitions (admin, auditor, finance_team)
- **chart_of_accounts**: Account structure per company

### Financial Tables
- **transactions**: Financial transaction records
- **transaction_lines**: Double-entry accounting line items
- **reconciliations**: Bank reconciliation records

### Document Intelligence
- **documents**: Invoice/receipt metadata
- **document_embeddings**: pgvector embeddings for RAG search

### Workflow & Audit
- **workflows**: Approval workflow definitions
- **workflow_instances**: Active workflow executions
- **workflow_approvals**: Step-by-step approvals
- **audit_logs**: Immutable change tracking

### Analytics
- **forecasts**: LSTM forecast results

## Key Features

- **Multi-tenancy**: All tables include `company_id` for isolation
- **pgvector**: Document embeddings use vector similarity search
- **RBAC**: Role-based access control via roles and permissions
- **Audit Trail**: All changes tracked in audit_logs
- **Double-entry**: Transaction lines ensure balanced entries

## Indexes

Performance indexes are created on:
- Company-scoped queries
- Transaction dates
- Document status
- Vector similarity search
- Audit log lookups

