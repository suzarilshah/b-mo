-- Seed data for development/testing
-- Insert sample company
INSERT INTO companies (id, name, legal_name, email, currency_code) VALUES
('00000000-0000-0000-0000-000000000001', 'Acme Corporation', 'Acme Corporation Inc.', 'info@acme.com', 'USD')
ON CONFLICT DO NOTHING;

-- Insert sample chart of accounts
INSERT INTO chart_of_accounts (id, company_id, account_code, account_name, account_type, balance_type) VALUES
-- Assets
('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001', '1000', 'Cash and Cash Equivalents', 'asset', 'debit'),
('00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000001', '1100', 'Accounts Receivable', 'asset', 'debit'),
('00000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000001', '1200', 'Inventory', 'asset', 'debit'),
-- Liabilities
('00000000-0000-0000-0000-000000000020', '00000000-0000-0000-0000-000000000001', '2000', 'Accounts Payable', 'liability', 'credit'),
('00000000-0000-0000-0000-000000000021', '00000000-0000-0000-0000-000000000001', '2100', 'Accrued Expenses', 'liability', 'credit'),
-- Equity
('00000000-0000-0000-0000-000000000030', '00000000-0000-0000-0000-000000000001', '3000', 'Retained Earnings', 'equity', 'credit'),
-- Revenue
('00000000-0000-0000-0000-000000000040', '00000000-0000-0000-0000-000000000001', '4000', 'Sales Revenue', 'revenue', 'credit'),
('00000000-0000-0000-0000-000000000041', '00000000-0000-0000-0000-000000000001', '4100', 'Service Revenue', 'revenue', 'credit'),
-- Expenses
('00000000-0000-0000-0000-000000000050', '00000000-0000-0000-0000-000000000001', '5000', 'Cost of Goods Sold', 'expense', 'debit'),
('00000000-0000-0000-0000-000000000051', '00000000-0000-0000-0000-000000000001', '5100', 'Operating Expenses', 'expense', 'debit')
ON CONFLICT DO NOTHING;

