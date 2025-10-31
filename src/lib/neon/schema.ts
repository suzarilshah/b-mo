/**
 * TypeScript types for database schema
 * These match the NeonDB schema structure
 */

export interface Company {
  id: string
  name: string
  legal_name?: string | null
  tax_id?: string | null
  address?: string | null
  phone?: string | null
  phone_country_code?: string | null
  email?: string | null
  website?: string | null
  currency_code: string
  fiscal_year_start?: string | null
  timezone: string
  created_at: string
  updated_at: string
  is_active: boolean
}

export interface Role {
  id: string
  name: string
  description?: string | null
  permissions: Record<string, any>
  created_at: string
}

export interface User {
  id: string
  appwrite_user_id: string
  email: string
  name: string
  role_id?: string | null
  company_id: string
  is_active: boolean
  last_login?: string | null
  created_at: string
  updated_at: string
}

export interface ChartOfAccount {
  id: string
  company_id: string
  account_code: string
  account_name: string
  account_type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense'
  parent_account_id?: string | null
  balance_type: 'debit' | 'credit'
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Transaction {
  id: string
  company_id: string
  transaction_date: string
  transaction_number?: string | null
  description?: string | null
  transaction_type: string
  amount: number
  currency_code: string
  status: 'pending' | 'approved' | 'rejected' | 'posted'
  posted_at?: string | null
  created_by?: string | null
  approved_by?: string | null
  created_at: string
  updated_at: string
}

export interface TransactionLine {
  id: string
  transaction_id: string
  account_id: string
  debit_amount: number
  credit_amount: number
  description?: string | null
  line_order: number
  created_at: string
}

export interface Document {
  id: string
  company_id: string
  appwrite_file_id: string
  file_name: string
  file_type?: string | null
  file_size?: number | null
  document_type: 'invoice' | 'receipt' | 'statement' | string
  ocr_confidence?: number | null
  ocr_data?: Record<string, any> | null
  extracted_data?: Record<string, any> | null
  status: 'uploaded' | 'processing' | 'review' | 'approved' | 'rejected'
  requires_review: boolean
  transaction_id?: string | null
  uploaded_by?: string | null
  reviewed_by?: string | null
  created_at: string
  updated_at: string
}

export interface DocumentEmbedding {
  id: string
  document_id: string
  content_text: string
  embedding: number[] // vector(1024)
  chunk_index: number
  metadata: Record<string, any>
  created_at: string
}

export interface AuditLog {
  id: string
  company_id: string
  user_id?: string | null
  action: string
  resource_type: string
  resource_id: string
  old_values?: Record<string, any> | null
  new_values?: Record<string, any> | null
  ip_address?: string | null
  user_agent?: string | null
  created_at: string
}

export interface Forecast {
  id: string
  company_id: string
  forecast_type: 'sales' | 'revenue' | 'expense' | 'kpi'
  metric_name?: string | null
  forecast_date: string
  predicted_value: number
  confidence_interval_lower?: number | null
  confidence_interval_upper?: number | null
  model_version?: string | null
  input_data?: Record<string, any> | null
  created_at: string
}

export interface Workflow {
  id: string
  company_id: string
  name: string
  description?: string | null
  workflow_type: string
  steps: Array<{
    step_number: number
    approver_role?: string
    approver_user_id?: string
    required: boolean
  }>
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface WorkflowInstance {
  id: string
  workflow_id: string
  company_id: string
  resource_type: string
  resource_id: string
  current_step: number
  status: 'pending' | 'in_progress' | 'approved' | 'rejected' | 'cancelled'
  initiated_by?: string | null
  completed_at?: string | null
  created_at: string
  updated_at: string
}

export interface WorkflowApproval {
  id: string
  workflow_instance_id: string
  step_number: number
  approver_id?: string | null
  status: 'pending' | 'approved' | 'rejected'
  comments?: string | null
  approved_at?: string | null
  created_at: string
}

export interface Reconciliation {
  id: string
  company_id: string
  account_id: string
  reconciliation_date: string
  statement_balance: number
  ledger_balance: number
  difference: number
  matched_transactions?: string[] | null
  unmatched_items?: Record<string, any>[] | null
  status: 'in_progress' | 'completed' | 'discrepancy'
  reconciled_by?: string | null
  completed_at?: string | null
  created_at: string
  updated_at: string
}

export interface Invitation {
  id: string
  email: string
  role_id?: string | null
  company_id: string
  invited_by?: string | null
  status: 'pending' | 'accepted' | 'expired'
  token: string
  expires_at: string
  created_at: string
  updated_at: string
}

