-- Verify that documents and document_embeddings tables exist with correct schema
-- Run this script to check if the schema is properly set up

-- Check if documents table exists
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'documents'
        ) THEN '✓ documents table exists'
        ELSE '✗ documents table does NOT exist'
    END as documents_table_check;

-- Check if document_embeddings table exists
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'document_embeddings'
        ) THEN '✓ document_embeddings table exists'
        ELSE '✗ document_embeddings table does NOT exist'
    END as document_embeddings_table_check;

-- Check if pgvector extension is enabled
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT FROM pg_extension WHERE extname = 'vector'
        ) THEN '✓ pgvector extension is enabled'
        ELSE '✗ pgvector extension is NOT enabled'
    END as pgvector_check;

-- Check documents table columns
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns
WHERE table_name = 'documents'
ORDER BY ordinal_position;

-- Check document_embeddings table columns
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns
WHERE table_name = 'document_embeddings'
ORDER BY ordinal_position;

-- Check if vector index exists on document_embeddings
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT FROM pg_indexes 
            WHERE tablename = 'document_embeddings' 
            AND indexname = 'document_embeddings_vector_idx'
        ) THEN '✓ Vector index exists'
        ELSE '✗ Vector index does NOT exist'
    END as vector_index_check;

