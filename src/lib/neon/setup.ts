import { query, enablePgVector } from './client'

/**
 * Initialize essential database schema (core tables only)
 * This creates the minimum tables needed for user registration
 */
export async function initializeEssentialSchema(): Promise<void> {
  try {
    // Enable required extensions
    await query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')
    await query('CREATE EXTENSION IF NOT EXISTS "vector"')
    
    // Create companies table
    await query(`
      CREATE TABLE IF NOT EXISTS companies (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(255) NOT NULL,
        legal_name VARCHAR(255),
        tax_id VARCHAR(100),
        address TEXT,
        phone VARCHAR(50),
        email VARCHAR(255),
        website VARCHAR(255),
        currency_code VARCHAR(3) DEFAULT 'USD',
        fiscal_year_start DATE,
        timezone VARCHAR(50) DEFAULT 'UTC',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        is_active BOOLEAN DEFAULT true
      )
    `)
    
    // Create roles table
    await query(`
      CREATE TABLE IF NOT EXISTS roles (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(50) UNIQUE NOT NULL,
        description TEXT,
        permissions JSONB NOT NULL DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `)
    
    // Insert default roles (ignore conflicts)
    await query(`
      INSERT INTO roles (name, description, permissions) VALUES
      ('admin', 'Full access to all features and data', '{"all": true}'::jsonb),
      ('auditor', 'Read-only access with audit trail visibility', '{"read": true, "audit": true}'::jsonb),
      ('finance_team', 'Can update ledger and approve expenses', '{"read": true, "write": true, "approve": true}'::jsonb)
      ON CONFLICT (name) DO NOTHING
    `)
    
    // Create users table
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        appwrite_user_id VARCHAR(255) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        role_id UUID REFERENCES roles(id) ON DELETE SET NULL,
        company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
        is_active BOOLEAN DEFAULT true,
        last_login TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `)
    
    // Create indexes
    await query('CREATE INDEX IF NOT EXISTS idx_users_company_id ON users(company_id)')
    await query('CREATE INDEX IF NOT EXISTS idx_users_appwrite_id ON users(appwrite_user_id)')
    
    // Create updated_at trigger function if it doesn't exist
    await query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql'
    `)
    
    // Create trigger for users table if it doesn't exist
    await query(`
      DROP TRIGGER IF EXISTS update_users_updated_at ON users
    `)
    await query(`
      CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
    `)
    
    console.log('✓ Essential schema initialized')
  } catch (error) {
    console.error('Failed to initialize essential schema:', error)
    throw error
  }
}

/**
 * Initialize database schema
 * Run this once to set up all tables and extensions
 */
export async function initializeSchema(): Promise<void> {
  try {
    console.log('Enabling pgvector extension...')
    await enablePgVector()
    console.log('✓ pgvector enabled')
    
    // Initialize essential schema
    await initializeEssentialSchema()
    
    console.log('Schema initialization complete')
    console.log('⚠️  For full schema with all tables, run database/schema.sql manually via psql or Neon console')
  } catch (error) {
    console.error('Failed to initialize schema:', error)
    throw error
  }
}

/**
 * Check if schema is initialized
 */
export async function checkSchema(): Promise<{ initialized: boolean; missing: string[] }> {
  const missing: string[] = []
  
  try {
    // Check for key tables
    const tables = [
      'companies',
      'users',
      'roles',
      'transactions',
      'documents',
      'chart_of_accounts',
    ]
    
    for (const table of tables) {
      try {
        await query(`SELECT 1 FROM ${table} LIMIT 1`)
      } catch (error: any) {
        if (error.message?.includes('does not exist')) {
          missing.push(table)
        }
      }
    }
    
    // Check for pgvector extension
    try {
      const result = await query(
        `SELECT 1 FROM pg_extension WHERE extname = 'vector'`
      )
      if (result.length === 0) {
        missing.push('pgvector extension')
      }
    } catch (error: any) {
      missing.push('pgvector extension')
    }
    
    return {
      initialized: missing.length === 0,
      missing,
    }
  } catch (error) {
    console.error('Failed to check schema:', error)
    return { initialized: false, missing: ['Unable to check'] }
  }
}

